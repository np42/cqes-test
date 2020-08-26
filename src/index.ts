import { VM, AST }   from 'cqes-util';
import * as Builtins from './builtins';
const colors = require('colors');

export type TestingTree       = TestingGroup | TestingChain;
export interface TestingGroup { [description: string]: TestingTree };
export type TestingChain      = Array<TestingItem>;
export type TestingItem       = Function | AST | TestingGroup | TestingChain;

export interface TestResult { count: number, data: any };

const vm = new VM(Builtins);

export const tick   = colors.green.bold('✔');
export const ballot = colors.red.bold('✗');

function applyResult(session: any, result: any) {
  if (typeof result == 'number') {
    session.count += result;
  } else if (result && 'count' in result) {
    session.count += result.count;
    session.data = result.value;
  } else {
    session.count += 1;
  }
}

export async function test(ast: TestingTree, data: any = null, indent: number = 0): Promise<TestResult> {
  const prefix = Array(indent).fill(' ').join('');
  const session = { count: 0, data };
  if (ast instanceof Array) {
    try {
      let result = session;
      for (const item of ast) {
        const param = item;
        if (typeof param === 'function') {
          result = { data: await param(result.data), count: result.count };
        } else if (param instanceof Array) {
          switch (typeof param[0]) {
          case 'string': {
            applyResult(result, vm.exec(result.data, '', <AST>param));
          } break ;
          case 'function': {
            result.data = param[0](result.data);
            if (param.length > 0)
              applyResult(result, await test(param.slice(1), result.data, indent));
          } break ;
          default : {
            applyResult(result, vm.exec(result.data, '', ['Assert.all', param]));
          } break ;
          }
        } else if (param && typeof param === 'object') {
          process.stdout.write('\n');
          const { count } = await test(param, result.data, indent);
          result = { data: result.data, count };
        }
      }
      return result;
    } catch (e) {
      failed(e);
      return { count: 0, data };
    }
  } else if (ast && typeof ast === 'object') {
    let didSucceed = false;
    for (const label in ast) {
      const value = ast[label];
      const hisChildIsObject = value && typeof value === 'object' && !(value instanceof Array);
      if (didSucceed) process.stdout.write('\n');
      process.stdout.write(prefix + label + ':');
      if (hisChildIsObject) process.stdout.write('\n');
      didSucceed = false;
      const { count } = await test(value, data, indent + 2);
      if (!hisChildIsObject) {
        if (count > 0) { didSucceed = true; succeed(count); }
        else process.stdout.write('\n');
      }
    }
    /* !! */ process.stdout.write('\n');
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
