import { VM, AST }   from './VM';
import * as Builtins from './builtins';
const colors = require('colors');

export type TestingTree       = TestingGroup | TestingChain;
export interface TestingGroup { [description: string]: TestingTree };
export type TestingChain      = Array<TestingItem>;
export type TestingItem       = Function | AST;

const vm = new VM();
export { Builtins };

export const tick   = colors.green.bold('✔');
export const ballot = colors.red.bold('✗');

export function test(tree: TestingTree, indent?: number) {
  if (indent == null) indent = 0;
  const prefix = Array(indent).fill(' ').join('');
  if (tree instanceof Array) {
    process.stdout.write(': ');
    try {
      let count = 0;
      tree.reduce((data, param) => {
        if (typeof param === 'function') {
          return param(data);
        } else if (param instanceof Array) {
          if (typeof param[0] == 'string') {
            const result = vm.exec(data, '', <AST>param);
            if (typeof result == 'number') count += result;
            else count += 1;
          } else {
            const result = vm.exec(data, '', ['Assert.all', param]);
            if (typeof result == 'number') count += result;
            else count += 1;
          }
          return data;
        }
      }, null);
      succeed(count);
    } catch (e) {
      failed(e);
    }
  } else if (tree && typeof tree === 'object') {
    if (indent > 0) process.stdout.write(':\n');
    for (const label in tree) {
      process.stdout.write(prefix + label);
      test(tree[label], indent + 2);
    }
  } else {
    throw new Error('TODO');
  }
};


export function succeed(count: number) {
  const s = count > 1 ? 's' : '';
  process.stdout.write(tick + ' ' + count + ' test' + s + ' passed\n');
}

export function failed(error: Error) {
  process.stdout.write(ballot + '\n');
  if (error) console.error(error);
}
