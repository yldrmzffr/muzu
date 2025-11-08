import 'reflect-metadata';

export const VALIDATION_METADATA_KEY = 'muzu:validation';

export interface ValidationRule {
  constraint: string;
  value?: any;
}

export function getValidationRules(
  target: any,
  propertyKey: string
): ValidationRule[] {
  return (
    Reflect.getMetadata(VALIDATION_METADATA_KEY, target, propertyKey) || []
  );
}

export function addValidationRule(
  target: any,
  propertyKey: string,
  rule: ValidationRule
): void {
  const existingRules = getValidationRules(target, propertyKey);
  Reflect.defineMetadata(
    VALIDATION_METADATA_KEY,
    [...existingRules, rule],
    target,
    propertyKey
  );
}
