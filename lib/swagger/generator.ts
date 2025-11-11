import {RouteManager} from '../routing/route-manager';
import {getRegisteredControllers} from '../controller/controller-registry';
import {OpenAPISpec, SwaggerConfig, Operation, Schema} from './types';
import {
  getApiOperation,
  getApiResponses,
  getApiParameters,
  getApiBody,
  getApiTags,
  TagDefinition,
} from './decorators';
import {getValidationRules} from '../validation';

export class SwaggerGenerator {
  constructor(
    private config: SwaggerConfig,
    private routeManager: RouteManager
  ) {}

  /**
   * Generates OpenAPI 3.0 specification
   */
  public generate(): OpenAPISpec {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: this.config.info,
      paths: {},
    };

    if (this.config.servers) {
      spec.servers = this.config.servers;
    }

    try {
      const controllers = getRegisteredControllers();
      const routes = this.routeManager.getRoutesWithMetadata();

      for (const route of routes) {
        const swaggerPath = this.convertPathToSwagger(route.path || '/');

        if (!spec.paths[swaggerPath]) {
          spec.paths[swaggerPath] = {};
        }

        const operation = this.buildOperation(route, controllers);
        const methodLower = route.method.toLowerCase();

        // Safely assign operation to path item
        const pathItem = spec.paths[swaggerPath];
        switch (methodLower) {
          case 'get':
            pathItem.get = operation;
            break;
          case 'post':
            pathItem.post = operation;
            break;
          case 'put':
            pathItem.put = operation;
            break;
          case 'patch':
            pathItem.patch = operation;
            break;
          case 'delete':
            pathItem.delete = operation;
            break;
        }
      }

      // Collect all unique tags from controllers and routes
      spec.tags = this.collectTags(controllers, routes);
    } catch (error) {
      // Graceful degradation: return partial spec if generation fails
      if (this.config.debug) {
        console.warn('[Muzu Swagger] Failed to generate full spec:', error);
      }
    }

    return spec;
  }

  /**
   * Builds an operation object for a route
   */
  private buildOperation(
    route: {
      method: string;
      path: string;
      handler: Function;
      metadata?: any;
    },
    controllers: any[]
  ): Operation {
    const handler = route.metadata?.originalHandler || route.handler;

    const operation: Operation = {
      responses: {
        '200': {
          description: 'Successful response',
        },
      },
    };

    try {
      // Get swagger metadata from decorators
      const apiOperation = getApiOperation(handler);
      const apiResponses = getApiResponses(handler);
      const apiParameters = getApiParameters(handler);
      const apiBody = getApiBody(handler);

      // Find controller tags
      const controllerTags = this.findControllerTags(handler, controllers);

      // Apply operation metadata
      this.applyOperationMetadata(operation, apiOperation);

      // Apply tags (method-level takes precedence over controller-level)
      this.applyTags(operation, handler, controllerTags);

      // Apply responses
      this.applyResponses(operation, apiResponses);

      // Apply parameters
      this.applyParameters(operation, route.path, apiParameters);

      // Apply request body
      this.applyRequestBody(operation, apiBody);
    } catch (error) {
      // Graceful degradation: return basic operation if metadata extraction fails
      if (this.config.debug) {
        console.warn(
          `[Muzu Swagger] Failed to build operation for ${route.method} ${route.path}:`,
          error
        );
      }
    }

    return operation;
  }

  /**
   * Finds controller tags for a given handler
   */
  private findControllerTags(
    handler: Function,
    controllers: any[]
  ): TagDefinition[] {
    for (const {target} of controllers) {
      const methods = Object.getOwnPropertyNames(target.prototype);
      if (methods.some(m => target.prototype[m] === handler)) {
        return getApiTags(target);
      }
    }
    return [];
  }

  /**
   * Applies operation metadata (summary, description, operationId)
   */
  private applyOperationMetadata(
    operation: Operation,
    apiOperation: any
  ): void {
    if (!apiOperation) return;

    if (apiOperation.summary) {
      operation.summary = apiOperation.summary;
    }
    if (apiOperation.description) {
      operation.description = apiOperation.description;
    }
    if (apiOperation.operationId) {
      operation.operationId = apiOperation.operationId;
    }
    if (apiOperation.tags) {
      operation.tags = apiOperation.tags;
    }
  }

  /**
   * Applies tags to operation (method-level takes precedence)
   */
  private applyTags(
    operation: Operation,
    handler: Function,
    controllerTags: TagDefinition[]
  ): void {
    const methodTags = getApiTags(handler);
    if (methodTags.length > 0) {
      operation.tags = this.normalizeTagsForOperation(methodTags);
    } else if (controllerTags.length > 0) {
      operation.tags = this.normalizeTagsForOperation(controllerTags);
    }
  }

  /**
   * Applies response definitions to operation
   */
  private applyResponses(operation: Operation, apiResponses: any[]): void {
    if (apiResponses.length === 0) return;

    operation.responses = {};
    for (const res of apiResponses) {
      const statusCode = String(res.status);
      operation.responses[statusCode] = {
        description: res.description,
      };

      if (res.type) {
        const schema = this.buildSchemaFromType(res.type, res.isArray);
        operation.responses[statusCode].content = {
          'application/json': {
            schema,
          },
        };
      }
    }
  }

  /**
   * Applies parameters (path, query, header) to operation
   */
  private applyParameters(
    operation: Operation,
    path: string,
    apiParameters: any[]
  ): void {
    const pathParams = this.extractPathParameters(path);
    if (pathParams.length === 0 && apiParameters.length === 0) return;

    operation.parameters = [];

    // Add path parameters
    for (const param of pathParams) {
      const apiParam = apiParameters.find(
        p => p.name === param && p.in === 'path'
      );
      operation.parameters.push({
        name: param,
        in: 'path',
        required: true,
        description: apiParam?.description,
        schema: {
          type: apiParam?.type || 'string',
        },
      });
    }

    // Add other parameters (query, header)
    for (const param of apiParameters) {
      if (param.in !== 'path') {
        operation.parameters.push({
          name: param.name,
          in: param.in,
          required: param.required,
          description: param.description,
          schema: {
            type: param.type || 'string',
            example: param.example,
          },
        });
      }
    }
  }

  /**
   * Applies request body definition to operation
   */
  private applyRequestBody(operation: Operation, apiBody: any): void {
    if (!apiBody || !apiBody.type) return;

    const schema = this.buildSchemaFromType(apiBody.type);
    operation.requestBody = {
      description: apiBody.description,
      required: apiBody.required !== false,
      content: {
        'application/json': {
          schema,
        },
      },
    };
  }

  /**
   * Builds a JSON Schema from a DTO class
   */
  private buildSchemaFromType(type: any, isArray = false): Schema {
    if (!type) {
      return {type: 'object'};
    }

    try {
      const instance = new type();
      const properties: Record<string, Schema> = {};
      const required: string[] = [];

      const propertyKeys = Object.getOwnPropertyNames(instance);

      for (const key of propertyKeys) {
        const rules = getValidationRules(type.prototype, key);
        const propSchema = this.buildPropertySchema(rules, required, key);
        properties[key] = propSchema;
      }

      const schema: Schema = {
        type: 'object',
        properties,
      };

      if (required.length > 0) {
        schema.required = required;
      }

      return isArray ? {type: 'array', items: schema} : schema;
    } catch (error) {
      // Graceful degradation: return basic schema if DTO instantiation fails
      if (this.config.debug) {
        console.warn('[Muzu Swagger] Failed to build schema from type:', error);
      }
      return {type: 'object'};
    }
  }

  /**
   * Builds a property schema from validation rules
   */
  private buildPropertySchema(
    rules: any[],
    required: string[],
    propertyKey: string
  ): Schema {
    const schema: Schema = {type: 'string'};

    for (const rule of rules) {
      this.applyRuleToSchema(schema, rule, required, propertyKey);
    }

    return schema;
  }

  /**
   * Applies a validation rule to a schema
   */
  private applyRuleToSchema(
    schema: Schema,
    rule: any,
    required: string[],
    propertyKey: string
  ): void {
    switch (rule.constraint) {
      // Type constraints
      case 'isString':
        schema.type = 'string';
        break;
      case 'isNumber':
        schema.type = 'number';
        break;
      case 'isInt':
        schema.type = 'integer';
        break;
      case 'isBoolean':
        schema.type = 'boolean';
        break;
      case 'isArray':
        schema.type = 'array';
        break;

      // Format constraints
      case 'isEmail':
        schema.type = 'string';
        schema.format = 'email';
        break;
      case 'isUrl':
        schema.type = 'string';
        schema.format = 'uri';
        break;
      case 'isUUID':
        schema.type = 'string';
        schema.format = 'uuid';
        break;

      // Numeric constraints
      case 'min':
        schema.minimum = rule.value as number;
        break;
      case 'max':
        schema.maximum = rule.value as number;
        break;

      // String constraints
      case 'minLength':
        schema.minLength = rule.value as number;
        break;
      case 'maxLength':
        schema.maxLength = rule.value as number;
        break;
      case 'matches':
        if (rule.value instanceof RegExp) {
          schema.pattern = rule.value.source;
        }
        break;

      // Enum constraint
      case 'isEnum':
        if (typeof rule.value === 'object') {
          schema.enum = Object.values(rule.value);
        }
        break;

      // Required constraint
      case 'isRequired':
        if (!required.includes(propertyKey)) {
          required.push(propertyKey);
        }
        break;
    }
  }

  /**
   * Collects all unique tags from controllers and routes
   */
  private collectTags(
    controllers: any[],
    routes: any[]
  ): Array<{name: string; description?: string}> {
    const tagMap = new Map<string, {name: string; description?: string}>();

    // Collect tags from controllers
    for (const {target} of controllers) {
      const tags = getApiTags(target);
      for (const tag of tags) {
        const normalized = this.normalizeTag(tag);
        if (!tagMap.has(normalized.name)) {
          tagMap.set(normalized.name, normalized);
        } else if (normalized.description) {
          // Update description if new one is provided
          const existing = tagMap.get(normalized.name)!;
          existing.description = normalized.description;
        }
      }
    }

    // Collect tags from routes (method-level tags)
    for (const route of routes) {
      const handler = route.metadata?.originalHandler || route.handler;
      const tags = getApiTags(handler);
      for (const tag of tags) {
        const normalized = this.normalizeTag(tag);
        if (!tagMap.has(normalized.name)) {
          tagMap.set(normalized.name, normalized);
        } else if (normalized.description) {
          const existing = tagMap.get(normalized.name)!;
          existing.description = normalized.description;
        }
      }
    }

    return Array.from(tagMap.values());
  }

  /**
   * Normalizes a tag definition to object format
   */
  private normalizeTag(tag: TagDefinition): {
    name: string;
    description?: string;
  } {
    if (typeof tag === 'string') {
      return {name: tag};
    }
    return tag;
  }

  /**
   * Normalizes tag definitions to string array for operation
   */
  private normalizeTagsForOperation(tags: TagDefinition[]): string[] {
    return tags.map(tag => (typeof tag === 'string' ? tag : tag.name));
  }

  /**
   * Converts Muzu path format to OpenAPI format
   * Example: /users/:id -> /users/{id}
   */
  private convertPathToSwagger(path: string): string {
    return path.replace(/:([^/]+)/g, '{$1}');
  }

  /**
   * Extracts path parameter names from a route
   * Example: /users/:id/posts/:postId -> ['id', 'postId']
   */
  private extractPathParameters(path: string): string[] {
    const params: string[] = [];
    const regex = /:([^/]+)/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    return params;
  }
}
