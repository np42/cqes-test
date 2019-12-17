import * as Builtins from './builtins';

export function equal(data: any, value: any, path?: string) {
  const strValue = JSON.stringify(value);
  if (path) {
    data = Builtins.get(data, path);
    const strData  = JSON.stringify(data);
    return 'expect ' + strData + ' from ' + path + ' to be equal with ' + strValue;
  } else {
    const strData  = JSON.stringify(data);
    return 'expect ' + strData + ' to be equal with ' + strValue;
  }
}

export function isString(data: any, path?: string) {
  if (path) {
    data = Builtins.get(data, path);
    const strData  = JSON.stringify(data);
    return 'expect ' + strData + ' from ' + path + ' to be a string';
  } else {
    const strData  = JSON.stringify(data);
    return 'expect ' + strData + ' to be a string';
  }
}