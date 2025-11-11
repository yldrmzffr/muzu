export interface SwaggerConfig {
  enabled?: boolean;
  path?: string;
  debug?: boolean;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    responses?: Record<string, Response>;
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
}

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: Schema;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema: Schema;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
}

export interface Schema {
  type?: string;
  format?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: any[];
  example?: any;
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
}
