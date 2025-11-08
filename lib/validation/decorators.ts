import {addValidationRule} from './metadata';

function createValidationDecorator(
  constraint: string,
  value?: any
): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    addValidationRule(target, propertyKey as string, {constraint, value});
  };
}

// Type validators
export function IsString(): PropertyDecorator {
  return createValidationDecorator('isString');
}

export function IsNumber(): PropertyDecorator {
  return createValidationDecorator('isNumber');
}

export function IsBoolean(): PropertyDecorator {
  return createValidationDecorator('isBoolean');
}

export function IsDate(): PropertyDecorator {
  return createValidationDecorator('isDate');
}

// String validators
export function MinLength(length: number): PropertyDecorator {
  return createValidationDecorator('minLength', length);
}

export function MaxLength(length: number): PropertyDecorator {
  return createValidationDecorator('maxLength', length);
}

export function IsEmail(): PropertyDecorator {
  return createValidationDecorator('isEmail');
}

export function IsUrl(): PropertyDecorator {
  return createValidationDecorator('isUrl');
}

export function IsUUID(): PropertyDecorator {
  return createValidationDecorator('isUUID');
}

export function Matches(pattern: RegExp): PropertyDecorator {
  return createValidationDecorator('matches', pattern);
}

// Number validators
export function Min(value: number): PropertyDecorator {
  return createValidationDecorator('min', value);
}

export function Max(value: number): PropertyDecorator {
  return createValidationDecorator('max', value);
}

export function IsInt(): PropertyDecorator {
  return createValidationDecorator('isInt');
}

export function IsPositive(): PropertyDecorator {
  return createValidationDecorator('isPositive');
}

export function IsNegative(): PropertyDecorator {
  return createValidationDecorator('isNegative');
}

// General validators
export function IsOptional(): PropertyDecorator {
  return createValidationDecorator('isOptional');
}

export function IsRequired(): PropertyDecorator {
  return createValidationDecorator('isRequired');
}

export function IsEnum(enumType: object): PropertyDecorator {
  return createValidationDecorator('isEnum', enumType);
}

// Array validators
export function IsArray(): PropertyDecorator {
  return createValidationDecorator('isArray');
}

export function ArrayMinSize(size: number): PropertyDecorator {
  return createValidationDecorator('arrayMinSize', size);
}

export function ArrayMaxSize(size: number): PropertyDecorator {
  return createValidationDecorator('arrayMaxSize', size);
}

export function ArrayItem(type: () => any): PropertyDecorator {
  return createValidationDecorator('arrayItem', type);
}
