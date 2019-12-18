import { VM, AST }   from './VM';
import * as Builtins from './builtins';
const colors = require('colors');

export type TestingTree       = TestingGroup | TestingChain;
export interface TestingGroup { [description: string]: TestingTree };
export type TestingChain      = Array<TestingItem>;
export type TestingItem       = Function | AST | TestingGroup;

const vm = new VM();
export { Builtins };

export const tick   = colors.green.bold('✔');
export const ballot = colors.red.bold('✗');

export function test(ast: TestingTree, data: any = null, indent: number = 0) {
  const prefix = Array(indent).fill(' ').join('');
  if (ast instanceof Array) {
    try {
      return ast.reduce((data, param) => {
        if (typeof param === 'function') {
          return param(data);
        } else if (param instanceof Array) {
          let count = 0;
          if (typeof param[0] == 'string') {
            const result = vm.exec(data, '', <AST>param);
            if (typeof result == 'number') count += result;
            else count += 1;
          } else {
            const result = vm.exec(data, '', ['Assert.all', param]);
            if (typeof result == 'number') count += result;
            else count += 1;
          }
          succeed(count);
          return data;
        } else if (param && typeof param === 'object') {
          process.stdout.write('\n');
          test(param, data, indent);
        }
        return data;
      }, data);
    } catch (e) {
      failed(e);
      return null;
    }
  } else if (ast && typeof ast === 'object') {
    for (const label in ast) {
      const value = ast[label];
      process.stdout.write(prefix + label + ':');
      if (value && typeof value === 'object' && !(value instanceof Array))
        process.stdout.write('\n');
      test(value, data, indent + 2);
    }
    if (indent == 0) process.stdout.write('\n');
    return data;
  } else {
    throw new Error('TODO');
  }
};


export function succeed(count: number) {
  const s = count > 1 ? 's' : '';
  process.stdout.write(' ' + tick + ' ' + count + ' test' + s + ' passed');
}

export function failed(error: Error) {
  process.stdout.write(' ' + ballot);
  if (error) console.error(error);
}
