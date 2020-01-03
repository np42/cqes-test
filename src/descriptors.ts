import { VM } from './VM';

export function equiv(data: any, value: any) {
  const strValue = JSON.stringify(value);
  const strData  = JSON.stringify(data);
  return 'expected: ' + strValue + ' got: ' + strData;
};

export function is(data: any) {
  const strData  = JSON.stringify(data);
  return 'expect ' + strData + ' to be a string';
};

export function String_contains(data: any, pattern: string) {
  const strData = JSON.stringify(data);
  return 'expect ' + strData + ' contains ' + pattern;
};

export function Math_greaterThan(data: any, compared: number) {
  return 'expect ' + JSON.stringify(data) + ' to be greater than ' + compared;
};

export function Math_lesserThan(data: any, compared: number) {
  return 'expect ' + JSON.stringify(data) + ' to be lesser than ' + compared;
};
