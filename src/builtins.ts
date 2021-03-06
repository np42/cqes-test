import { AST, VM, get, join } from 'cqes-util';
import { C, E, Q, R, S }      from 'cqes';
import * as Descriptors       from './descriptors';
import { v4 as uuid }         from 'uuid';
import * as _assert           from 'assert';

export function equiv(data: any, path: string, value: any) {
  try {
    _assert.deepEqual(get(data, path), value);
    return true;
  } catch (e) {
    return false;
  }
};

export function is(data: any, path: string, type: string) {
  const value      = get(data, path);
  const expect     = String(type).toLowerCase();
  if (expect === 'null') return value == null;
  const objectType = Object.prototype.toString.call(value);
  const typeName   = objectType.substring(8, objectType.length - 1).toLowerCase();
  return typeName === expect;
};

export function isUUID(data: any, path: string) {
  return /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(get(data, path));
};

export function count(data: any, path: string, content: any, count: number) {
  const collection = get(data, path);
  if (collection instanceof Array) {
    let sum = 0;
    for (let i = 0; i < collection.length; i += 1)
      sum += has(collection[i], '', content) ? 1 : 0;
    return sum === count;
  } else if (collection instanceof Set) {
    console.log('TODO', __filename);
    return false;
  } else if (collection instanceof Map) {
    console.log('TODO', __filename);
    return false;
  } else {
    return count === 1 && has(collection, '', content);
  }
}

export function hasNot(data: any, path: string, content: any) {
  return !has(data, path, content);
}

export function has(data: any, path: string, content: any) {
  const value = get(data, path);
  if (value instanceof Array) {
    switch (content) {
    case 'boolean': case 'number': case 'string':
      return ~value.indexOf(content);
    default :
      if (content == null) return true;
      for (const item of value)
        if (has(item, '', content))
          return true;
      return false;
    }
  } else if (value instanceof Set) {
    console.log('TODO', __filename);
    return false;
  } else if (value instanceof Map) {
    console.log('TODO', __filename);
    return false;
  } else if (value instanceof Object) {
    if (content instanceof Object) {
      for (const key in content)
        if (!has(value[key], '', content[key]))
          return false;
      return true;
    } else {
      return false;
    }
  } else if (value == content) {
    return true;
  } else {
    return false;
  }
}

export function assert(data: any, path: string, test: AST | Function) {
  let result = null;
  let name = null;
  if (typeof test === 'function') {
    result = test(data, path)
    name   = String(test);
    if (typeof result === 'number' && result > 0) return result;
    if (result == null || result === true) return 1;
    throw new Error(name + ': not satisfied');
  } else {
    result = this.exec(data, path, test);
    name   = test[0].indexOf('.') > 0 ? test[0].replace(/\./g, '_') : test[0];
    if (typeof result === 'number' && result > 0) return result;
    if (result == null || result === true) return 1;
    if (name in Descriptors) {
      const value = get(data, path);
      const message = Descriptors[name].apply(this, [value, ...test.slice(1)]);
      throw new Error((path || '(root)') + ': ' + message);
    } else {
      throw new Error(JSON.stringify(test) + ': not satisfied');
    }
  }
};

export function Assert_all(data: any, path: string, tests: AST[]) {
  return tests.reduce((passed, test) => passed + assert.call(this, data, test));
};

export function Assert_fields(data: any, path: string, ...tests: AST[]) {
  return tests.reduce((passed, test) => {
    const newPath = join(path, test[0]);
    if (test[1] instanceof Array) {
      return passed + Assert_fields.apply(this, [data, newPath, ...test.slice(1)]);
    } else {
      return passed + assert.call(this, data, newPath, test.slice(1));
    }
  }, 0);
};

export function Assert_equiv(data: any, path: string, value: any) {
  if (equiv(data, path, value)) return ;
  throw new Error(JSON.stringify(get(data, path)) + ' != ' + JSON.stringify(value));
}

export function Math_greaterThan(data: any, path: string, compared: number) {
  return get(data, path) > compared;
}

export function Math_lesserThan(data: any, path: string, compared: number) {
  return get(data, path) < compared;
}

export function String_contains(data: any, path: string, pattern: string) {
  const value = get(data, path);
  if (typeof value != 'string') return false;
  return !!~value.indexOf(pattern);
};

export function Manager_test(data: any, path: string, options: any, ...tests: any[]) {
  const category = options.state && options.state.name || 'Test';
  const id       = uuid();
  const streamId = category + '-' + id;
  const CH       = options.Manager.CommandHandlers;
  const DH       = options.Manager.DomainHandlers;
  let state      = data instanceof S ? data : new S(streamId, -1, options.state.from({}));
  let count      = 0;
  for (const test of tests) {
    count += 1;
    const command = new C(category, id, test.order, test.data, test.meta);
    const events = [];
    if ('order' in test) {
      const result = CH.prototype[test.order](state, command, (e: E) => events.push(e));
      if (result instanceof E) events.push(result);
      if (test.expectTypes) {
        const types = test.expectTypes instanceof Array ? test.expectTypes : [test.expectTypes];
        for (const type of types) {
          count += 1;
          if (!events.reduce((ok: boolean, evt: E) => ok ? ok : evt.type === type, false))
            throw new Error('Expected an event of type: ' + test.expectType);
        }
      }
      if (test.assertEvents) {
        for (const type in test.assertEvents) {
          events.forEach(event => {
            if (event.type != type) return ;
            test.assertEvents[type].forEach((test: AST) => {
              count += 1;
              this.exec(event, test[0], ['assert', test.slice(1)]);
            });
          });
        }
      }
    } else if ('event' in test) {
      events.push(new E(category, streamId, -1, test.event, test.data));
    }
    for (const event of events) {
      const revision = state.revision;
      const result = DH.prototype[event.type](state, event);
      if (result instanceof S) state = result;
      //state.data = options.state.from(state.data);
      state.revision = revision + 1;
    }
    if (test.assertState) {
      test.assertState.forEach((test: AST) => {
        count += 1;
        this.exec(state, test[0], ['assert', test.slice(1)]);
      });
    }
  }
  return { count, value: state };
}
