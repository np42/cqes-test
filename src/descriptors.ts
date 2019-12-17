import { VM } from './VM';

export function equals(data: any, path: string, value: any) {
  const strValue = JSON.stringify(value);
  data = VM.get(data, path);
  const strData  = JSON.stringify(data);
  return 'expect ' + strData + ' from ' + path + ' to be equal with ' + strValue;
}

export function is(data: any, path: string) {
  data = VM.get(data, path);
  const strData  = JSON.stringify(data);
  return 'expect ' + strData + ' from ' + path + ' to be a string';
}

export function String_contains(data: any, path: string, pattern: string) {
  data = VM.get(data, path);
  const strData = JSON.stringify(data);
  return 'expect ' + strData + ' from ' + path + ' contains ' + pattern;
}
