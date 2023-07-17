import {MuzuException} from './muzu.exception';

export class NotFoundException extends MuzuException {
  public readonly status: number = 404;
  constructor(message = 'Not Found!', readonly details?: any) {
    const status = 404;
    super(status, message, details);
  }
}
