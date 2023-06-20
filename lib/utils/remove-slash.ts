export function removeSlash(str: string): string {
  return str.replace(/^\//, '').replace(/\/$/, '');
}
