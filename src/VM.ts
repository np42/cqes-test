import * as Builtins from './builtins';

export type AST = [string, ...any[]];

export class VM {
  protected functions: Map<string, Function>;

  static get(data: any, path: string) {
    if (!path) return data;
    return path.split('.').reduce((value, key) => value ? value[key] : null, data);
  }

  static set(data: any, path: string, value: any) {

  }

  static join(...paths: Array<string>) {
    return paths.reduce((result, arg) => result + (result ? '.' : '') + arg, '');
  }

  constructor() {
    this.functions = new Map();
  }

  public exec(data: any, path: string, ast: AST) {
    if (!(ast instanceof Array) || typeof ast[0] != 'string') debugger;
    const action = ast[0].indexOf('.') > 0 ? ast[0].replace(/\./g, '_') : ast[0];
    if (action == null) return data;
    const method = this.functions.get(action);
    if (method != null) {
      return method.apply(this, [data, path, ...ast.slice(1)]);
    } else if (action in Builtins) {
      return Builtins[action].apply(this, [data, path, ...ast.slice(1)]);
    } else {
      throw new Error('function ' + action + ' not found');
    }
  }

}
