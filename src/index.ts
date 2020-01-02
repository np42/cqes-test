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
  const session = { count: 0, data };
  if (ast instanceof Array) {
    try {
      return ast.reduce((session, param) => {
        if (typeof param === 'function') {
          return { data: param(session.data), count: 0 };
        } else if (param instanceof Array) {
          if (typeof param[0] == 'string') {
            const result = vm.exec(session.data, '', <AST>param);
            if (typeof result == 'number') {
              session.count += result;
            } else if (result && 'count' in result) {
              session.count += result.count;
              session.data = result.value;
            } else {
              session.count += 1;
            }
          } else {
            const result = vm.exec(session.data, '', ['Assert.all', param]);
            if (typeof result == 'number') {
              session.count += result;
            } else if (result && 'count' in result) {
              session.count += result.count;
              session.data = result.value;
            } else {
              session.count += 1;
            }
          }
          return session;
        } else if (param && typeof param === 'object') {
          process.stdout.write('\n');
          test(param, data, indent);
          return { data, count: 0 };
        } else {
          return session;
        }
      }, session);
    } catch (e) {
      failed(e);
      return { count: 0, data };
    }
  } else if (ast && typeof ast === 'object') {
    for (const label in ast) {
      const value = ast[label];
      const hisChildIsObject = value && typeof value === 'object' && !(value instanceof Array);
      process.stdout.write(prefix + label + ':');
      if (hisChildIsObject) process.stdout.write('\n');
      const { count } = test(value, data, indent + 2);
      if (!hisChildIsObject) {
        if (count > 0) succeed(count);
        else process.stdout.write('\n');
      }
    }
    if (indent == 0) process.stdout.write('\n');
    return { data, count: 0 };
  } else {
    throw new Error('TODO');
  }
};


export function succeed(count: number) {
  if (count == 0) return ;
  const s = count > 1 ? 's' : '';
  process.stdout.write(' ' + tick + ' ' + count + ' test' + s + ' passed');
}

export function failed(error: Error) {
  process.stdout.write(' ' + ballot);
  if (error) {
    if (error) process.stderr.write('\n');
    console.error(error);
  }
}
