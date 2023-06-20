import {IncomingMessage} from 'http';
import {RouteHandler} from '../types';

export interface Route {
  method: string;
  url: string;
  handler: RouteHandler;
}

export interface Request extends IncomingMessage {
  params?: Record<string, string>;
  body?: Record<string, string>;
}
