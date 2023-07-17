import {MuzuException} from './muzu.exception';

export class HttpException extends MuzuException {
  constructor(
    readonly status: number,
    readonly message: string,
    readonly details?: any
  ) {
    super(status, message, details);
  }
}
