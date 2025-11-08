import {HttpStatus} from '../constants/http-status';
import {MuzuException} from './muzu.exception';

export interface ValidationError {
  field: string;
  constraint: string;
  value: any;
  message?: string;
}

export class ValidationException extends MuzuException {
  public readonly status: number = HttpStatus.BAD_REQUEST;
  constructor(
    readonly errors: ValidationError[],
    readonly message: string = 'Validation failed'
  ) {
    super(HttpStatus.BAD_REQUEST, message);
  }
}
