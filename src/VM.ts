import * as Builtins from './builtins';

export type AST = [string, ...any[]];

export class VM {
  protected methods: Map<string, Function>;

  constructor() {
    this.methods = new Map();
  }

  public exec(ast: AST, data: any) {
    debugger;
    const action = ast[0];
    if (action == null) return data;
    const method = this.methods.get(action);
    if (method != null) {
      return method.apply(this, [data].concat(ast.slice(1)));
    } else if (action in Builtins) {
      return Builtins[action].apply(this, [data].concat(ast.slice(1)));
    } else {
      throw new Error('function ' + action + ' not found');
    }
  }

}
