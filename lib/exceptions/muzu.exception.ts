export class MuzuException extends Error {
  constructor(
    readonly status: number,
    readonly message: string,
    readonly details?: any,
    public readonly kind: string = 'MuzuException'
  ) {
    super(message);
  }
}
