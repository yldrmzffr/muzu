/**
 * Swagger/OpenAPI decorators for documenting routes
 */

export interface ApiOperationOptions {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
}

export interface ApiResponseOptions {
  status: number;
  description: string;
  type?: any;
  isArray?: boolean;
}

export interface ApiParameterOptions {
  name: string;
  in: 'query' | 'path' | 'header';
  description?: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'integer';
  example?: any;
}

export interface ApiBodyOptions {
  description?: string;
  required?: boolean;
  type?: any;
}

/**
 * Documents an API operation
 */
export function ApiOperation(options: ApiOperationOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('swagger:operation', options, target[propertyKey]);
    return descriptor;
  };
}

/**
 * Documents an API response
 */
export function ApiResponse(options: ApiResponseOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Validate status code (silently ignore invalid codes)
    if (options.status < 100 || options.status > 599) {
      return descriptor;
    }

    const existingResponses =
      Reflect.getMetadata('swagger:responses', target[propertyKey]) || [];
    existingResponses.push(options);
    Reflect.defineMetadata(
      'swagger:responses',
      existingResponses,
      target[propertyKey]
    );
    return descriptor;
  };
}

/**
 * Documents a query/path/header parameter
 */
export function ApiParameter(options: ApiParameterOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Validate parameter name (silently ignore invalid names)
    if (!options.name || options.name.trim().length === 0) {
      return descriptor;
    }

    const existingParams =
      Reflect.getMetadata('swagger:parameters', target[propertyKey]) || [];
    existingParams.push(options);
    Reflect.defineMetadata(
      'swagger:parameters',
      existingParams,
      target[propertyKey]
    );
    return descriptor;
  };
}

/**
 * Documents request body
 */
export function ApiBody(options: ApiBodyOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('swagger:body', options, target[propertyKey]);
    return descriptor;
  };
}

/**
 * Tag definition with optional description
 */
export type TagDefinition = string | {name: string; description?: string};

/**
 * Tags a controller or operation
 * Can accept either strings or objects with name and description
 *
 * @example
 * @ApiTags('Users', 'Authentication')
 * @ApiTags({ name: 'Users', description: 'User management endpoints' })
 */
export function ApiTags(...tags: TagDefinition[]) {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey && descriptor) {
      // Method decorator
      Reflect.defineMetadata('swagger:tags', tags, target[propertyKey]);
      return descriptor;
    } else {
      // Class decorator
      Reflect.defineMetadata('swagger:tags', tags, target);
      return target;
    }
  };
}

/**
 * Gets API operation metadata
 */
export function getApiOperation(target: any): ApiOperationOptions | undefined {
  return Reflect.getMetadata('swagger:operation', target);
}

/**
 * Gets API responses metadata
 */
export function getApiResponses(target: any): ApiResponseOptions[] {
  return Reflect.getMetadata('swagger:responses', target) || [];
}

/**
 * Gets API parameters metadata
 */
export function getApiParameters(target: any): ApiParameterOptions[] {
  return Reflect.getMetadata('swagger:parameters', target) || [];
}

/**
 * Gets API body metadata
 */
export function getApiBody(target: any): ApiBodyOptions | undefined {
  return Reflect.getMetadata('swagger:body', target);
}

/**
 * Gets API tags metadata
 */
export function getApiTags(target: any): TagDefinition[] {
  return Reflect.getMetadata('swagger:tags', target) || [];
}
