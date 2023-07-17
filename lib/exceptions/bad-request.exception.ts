import {MuzuException} from './muzu.exception';

export class BadRequestException extends MuzuException {
  public readonly status: number = 400;
  constructor(
    readonly message: string = 'Bad Request!',
    readonly details?: any
  ) {
    const status = 400;
    super(status, message, details);
  }
}
