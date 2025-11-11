import {IncomingMessage} from 'http';
import {RouteHandler} from '../types';
import {CompiledValidator} from '../validation';

export interface Route {
  method: string;
  url: string;
  handler: RouteHandler;
  originalHandler?: RouteHandler;
  middlewares?: Function[];
  hasQueryParams?: boolean;
  bodyValidator?: CompiledValidator;
  queryValidator?: CompiledValidator;
}

export interface Request extends IncomingMessage {
  params?: Record<string, string>;
  body?: Record<string, string>;
  [key: string]: any;
}
