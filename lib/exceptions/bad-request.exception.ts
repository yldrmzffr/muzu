import {HttpStatus} from '../constants/http-status';
import {MuzuException} from './muzu.exception';

export class BadRequestException extends MuzuException {
  public readonly status: number = HttpStatus.BAD_REQUEST;
  constructor(
    readonly message: string = 'Bad Request!',
    readonly details?: any
  ) {
    super(HttpStatus.BAD_REQUEST, message, details);
  }
}
