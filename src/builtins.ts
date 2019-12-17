import { AST, VM }      from './VM';
import * as Descriptors from './descriptors';

export function equal(data: any, path: string, value: any) {
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
  if (test[0] in Descriptors) {
    throw new Error(Descriptors[test[0]].apply(this, [data, path, ...test.slice(1)]));
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

export function String_contains(data: any, path: string, pattern: string) {
  const value = VM.get(data, path);
  if (typeof value != 'string') return false;
  return !!~value.indexOf(pattern);
};
