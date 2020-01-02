import { AST, VM }       from './VM';
import * as Descriptors  from './descriptors';
import { C, E, Q, R, S } from 'cqes';

export function equiv(data: any, path: string, value: any) {
  return VM.get(data, path) == value;
};

export function is(data: any, path: string, type: string) {
  return typeof VM.get(data, path) === type;
};

export function assert(data: any, path: string, test: AST) {
  const result = this.exec(data, path, test);
  if (typeof result === 'number' && result > 0) return result;
  if (result) return 1;
  const name = test[0].indexOf('.') > 0 ? test[0].replace(/\./g, '_') : test[0];
  if (name in Descriptors) {
    const value = VM.get(data, path);
    const message = Descriptors[name].apply(this, [value, ...test.slice(2)]);
    const realPath = VM.join(path, test[1]);
    throw new Error((realPath || '(root)') + ': ' + message);
  } else {
    throw new Error(JSON.stringify(test) + ': not satisfied');
  }
};

export function Assert_all(data: any, path: string, tests: AST[]) {
  return tests.reduce((passed, test) => passed + assert.call(this, data, test));
};

export function Assert_fields(data: any, path: string, ...tests: AST[]) {
  return tests.reduce((passed, test) => {
    const newPath = VM.join(path, test[0]);
    if (test[1] instanceof Array) {
      return passed + Assert_fields.apply(this, [data, newPath, ...test.slice(1)]);
    } else {
      return passed + assert.call(this, data, newPath, test.slice(1));
    }
  }, 0);
};

export function Math_greaterThan(data: any, path: string, compared: number) {
  return VM.get(data, path) > compared;
}

export function Math_lesserThan(data: any, path: string, compared: number) {
  return VM.get(data, path) < compared;
}

export function String_contains(data: any, path: string, pattern: string) {
  const value = VM.get(data, path);
  if (typeof value != 'string') return false;
  return !!~value.indexOf(pattern);
};

export function Manager_test(data: any, path: string, options: any, ...tests: any[]) {
  const category = options.state && options.state.name || 'Test';
  const id       = 'test42';
  const streamId = category + '-' + id;
  const CH       = options.Manager.CommandHandlers;
  const DH       = options.Manager.DomainHandlers;
  let state      = data instanceof S ? data : new S(streamId, -1, new options.state());
  for (const test of tests) {
    const command = new C(category, id, test.order, test.data, test.meta);
    let events = CH.prototype[test.order](state, command);
    if (events instanceof E) events = [events];
    else if (events == null) events = [];
    for (const event of events) {
      const result = DH.prototype[event.type](state, event);
      if (result == null) continue ;
      state = result;
    }
  }
  state.data = options.state.from(state.data);
  return { count: tests.length, value: state };
}
