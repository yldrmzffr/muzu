import {getValidationRules, ValidationRule} from './metadata';
import {ValidationError} from '../exceptions/validation.exception';

export type CompiledValidator = (obj: unknown) => ValidationError[];

interface PropertyValidation {
  propertyKey: string;
  rules: ValidationRule[];
  isOptional: boolean;
}

interface CompilationContext {
  [key: string]: unknown;
}

// Regex patterns for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ConstraintHandler {
  generateCode: (
    propertyKey: string,
    rule: ValidationRule,
    value: string
  ) => string;
}

const constraintHandlers: Record<string, ConstraintHandler> = {
  // Type validators
  isString: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'string') {
    pushError('${prop}', 'isString', ${val}, '${prop} must be a string');
  }`,
  },
  isNumber: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'number' || isNaN(${val})) {
    pushError('${prop}', 'isNumber', ${val}, '${prop} must be a number');
  }`,
  },
  isBoolean: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'boolean') {
    pushError('${prop}', 'isBoolean', ${val}, '${prop} must be a boolean');
  }`,
  },
  isDate: {
    generateCode: (prop, _rule, val) =>
      `if (!(${val} instanceof Date) || isNaN(${val}.getTime())) {
    pushError('${prop}', 'isDate', ${val}, '${prop} must be a valid date');
  }`,
  },

  // Format validators
  isEmail: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'string' || !EMAIL_REGEX.test(${val})) {
    pushError('${prop}', 'isEmail', ${val}, '${prop} must be a valid email');
  }`,
  },
  isUrl: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'string' || !URL_REGEX.test(${val})) {
    pushError('${prop}', 'isUrl', ${val}, '${prop} must be a valid URL');
  }`,
  },
  isUUID: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'string' || !UUID_REGEX.test(${val})) {
    pushError('${prop}', 'isUUID', ${val}, '${prop} must be a valid UUID');
  }`,
  },

  // Number validators
  isInt: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'number' || !Number.isInteger(${val})) {
    pushError('${prop}', 'isInt', ${val}, '${prop} must be an integer');
  }`,
  },
  isPositive: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'number' || ${val} <= 0) {
    pushError('${prop}', 'isPositive', ${val}, '${prop} must be a positive number');
  }`,
  },
  isNegative: {
    generateCode: (prop, _rule, val) =>
      `if (typeof ${val} !== 'number' || ${val} >= 0) {
    pushError('${prop}', 'isNegative', ${val}, '${prop} must be a negative number');
  }`,
  },
  min: {
    generateCode: (prop, rule, val) =>
      `if (typeof ${val} === 'number' && ${val} < ${rule.value}) {
    pushError('${prop}', 'min', ${val}, '${prop} must be at least ${rule.value}');
  }`,
  },
  max: {
    generateCode: (prop, rule, val) =>
      `if (typeof ${val} === 'number' && ${val} > ${rule.value}) {
    pushError('${prop}', 'max', ${val}, '${prop} must be at most ${rule.value}');
  }`,
  },

  // String validators
  minLength: {
    generateCode: (prop, rule, val) =>
      `if (typeof ${val} === 'string' && ${val}.length < ${rule.value}) {
    pushError('${prop}', 'minLength', ${val}, '${prop} must be at least ${rule.value} characters');
  }`,
  },
  maxLength: {
    generateCode: (prop, rule, val) =>
      `if (typeof ${val} === 'string' && ${val}.length > ${rule.value}) {
    pushError('${prop}', 'maxLength', ${val}, '${prop} must be at most ${rule.value} characters');
  }`,
  },
  matches: {
    generateCode: (prop, rule, val) =>
      `if (typeof ${val} === 'string' && !pattern_${prop}.test(${val})) {
    pushError('${prop}', 'matches', ${val}, '${prop} format is invalid');
  }`,
  },

  // Array validators
  isArray: {
    generateCode: (prop, _rule, val) =>
      `if (!Array.isArray(${val})) {
    pushError('${prop}', 'isArray', ${val}, '${prop} must be an array');
  }`,
  },
  arrayMinSize: {
    generateCode: (prop, rule, val) =>
      `if (Array.isArray(${val}) && ${val}.length < ${rule.value}) {
    pushError('${prop}', 'arrayMinSize', ${val}, '${prop} must contain at least ${rule.value} items');
  }`,
  },
  arrayMaxSize: {
    generateCode: (prop, rule, val) =>
      `if (Array.isArray(${val}) && ${val}.length > ${rule.value}) {
    pushError('${prop}', 'arrayMaxSize', ${val}, '${prop} must contain at most ${rule.value} items');
  }`,
  },
  isEnum: {
    generateCode: (prop, _rule, val) =>
      `if (!Object.values(enumValues_${prop}).includes(${val})) {
    pushError('${prop}', 'isEnum', ${val}, '${prop} must be one of the allowed values');
  }`,
  },
  arrayItem: {
    generateCode: (prop, _rule, val) =>
      `if (Array.isArray(${val})) {
    for (let i = 0; i < ${val}.length; i++) {
      const itemErrors = validators_${prop}(${val}[i]);
      for (const err of itemErrors) {
        errors.push({
          field: \`${prop}[\${i}].\${err.field}\`,
          constraint: err.constraint,
          value: err.value,
          message: err.message
        });
      }
    }
  }`,
  },
};

function generatePropertyValidation(
  propertyKey: string,
  rules: ValidationRule[],
  isOptional: boolean
): string {
  const codes: string[] = [];
  const value = `obj.${propertyKey}`;
  const hasRequired = rules.some(r => r.constraint === 'isRequired');

  if (hasRequired) {
    codes.push(`
  if (${value} === undefined || ${value} === null) {
    pushError('${propertyKey}', 'isRequired', ${value}, '${propertyKey} is required');
  }`);
  }

  if (isOptional && !hasRequired) {
    codes.push(`if (${value} !== undefined && ${value} !== null) {`);
  }

  for (const rule of rules) {
    if (rule.constraint === 'isOptional' || rule.constraint === 'isRequired') {
      continue;
    }

    const handler = constraintHandlers[rule.constraint];
    if (handler) {
      codes.push('  ' + handler.generateCode(propertyKey, rule, value));
    }
  }

  if (isOptional && !hasRequired) {
    codes.push('}');
  }

  return codes.join('\n');
}

export function compileValidator(dtoClass: unknown): CompiledValidator {
  const instance = new (dtoClass as new () => object)();
  const propertyKeys = Object.getOwnPropertyNames(instance);

  const validations: PropertyValidation[] = [];
  const context: CompilationContext = {
    EMAIL_REGEX,
    URL_REGEX,
    UUID_REGEX,
  };

  for (const propertyKey of propertyKeys) {
    const rules = getValidationRules(
      (dtoClass as {prototype: object}).prototype,
      propertyKey
    );
    if (rules.length === 0) continue;

    const isOptional = rules.some(r => r.constraint === 'isOptional');

    const enumRule = rules.find(r => r.constraint === 'isEnum');
    if (enumRule) {
      context[`enumValues_${propertyKey}`] = enumRule.value;
    }

    const matchesRule = rules.find(r => r.constraint === 'matches');
    if (matchesRule) {
      context[`pattern_${propertyKey}`] = matchesRule.value;
    }

    const arrayItemRule = rules.find(r => r.constraint === 'arrayItem');
    if (arrayItemRule) {
      const itemDtoClass = (arrayItemRule.value as () => unknown)();
      context[`validators_${propertyKey}`] = compileValidator(itemDtoClass);
    }

    validations.push({propertyKey, rules, isOptional});
  }

  let code = 'return function validate(obj) {\n';
  code += '  const errors = [];\n';
  code += '  const pushError = (field, constraint, value, message) => {\n';
  code += '    errors.push({field, constraint, value, message});\n';
  code += '  };\n';

  for (const {propertyKey, rules, isOptional} of validations) {
    const validationCode = generatePropertyValidation(
      propertyKey,
      rules,
      isOptional
    );
    if (validationCode.trim()) {
      code += '\n' + validationCode;
    }
  }

  code += '\n  return errors;\n';
  code += '}';

  const func = new Function(...Object.keys(context), code);
  return func(...Object.values(context)) as CompiledValidator;
}
