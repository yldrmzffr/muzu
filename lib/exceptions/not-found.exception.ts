import {HttpStatus} from '../constants/http-status';
import {MuzuException} from './muzu.exception';

export class NotFoundException extends MuzuException {
  public readonly status: number = HttpStatus.NOT_FOUND;
  constructor(message = 'Not Found!', readonly details?: any) {
    super(HttpStatus.NOT_FOUND, message, details);
  }
}
