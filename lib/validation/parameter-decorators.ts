import 'reflect-metadata';

export const VALIDATION_BODY_KEY = 'muzu:validation:body';
export const VALIDATION_QUERY_KEY = 'muzu:validation:query';

export interface ValidationMetadata {
  bodyDto?: any;
  queryDto?: any;
}

export function getValidationMetadata(
  target: any,
  propertyKey: string | symbol
): ValidationMetadata {
  return {
    bodyDto: Reflect.getMetadata(VALIDATION_BODY_KEY, target, propertyKey),
    queryDto: Reflect.getMetadata(VALIDATION_QUERY_KEY, target, propertyKey),
  };
}

export function ValidateBody(dto: any): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(VALIDATION_BODY_KEY, dto, target, propertyKey);
    return descriptor;
  };
}

export function ValidateQuery(dto: any): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(VALIDATION_QUERY_KEY, dto, target, propertyKey);
    return descriptor;
  };
}
