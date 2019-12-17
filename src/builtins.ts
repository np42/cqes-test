import { AST }          from './VM';
import * as Descriptors from './descriptors';

export function get(data: any, path?: string) {
  return typeof path != 'string' ? data
    : path.split('.').reduce((value, key) => value ? value[key] : null, data);
};

export function equal(data: any, value: any, path?: string) {
  if (arguments.length > 2) data = get(data, path);
  return data == value;
}

export function isString(data: any, path?: string) {
  if (arguments.length > 1) data = get(data, path);
  return typeof data === 'string';
}

export function assertAll(data: any, tests: AST[]) {
  tests.forEach(test => {
    if (this.exec(test, data)) return ;
    if (test[0] in Descriptors) {
      throw new Error(Descriptors[test[0]].apply(this, [data].concat(test.slice(1))));
    } else {
      throw new Error(JSON.stringify(test) + ': not satisfied');
    }
  });
}
