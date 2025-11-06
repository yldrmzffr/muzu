import {RouteHandler} from '../types';
import {PathParser} from './path-parser';

export interface RouteMetadata {
  handler: RouteHandler;

  composedMiddleware?: ComposedMiddleware;

  isAsync: boolean;
  requiresBody: boolean;
  hasQueryParams: boolean;

  pathParser: PathParser;

  method: string;
}

export type ComposedMiddleware = (req: any, res: any) => Promise<void> | void;

export function composeMiddlewares(
  middlewares?: Function[]
): ComposedMiddleware | undefined {
  if (!middlewares || middlewares.length === 0) {
    return undefined;
  }

  if (middlewares.length === 1) {
    return middlewares[0] as ComposedMiddleware;
  }

  return async (req: any, res: any) => {
    for (const middleware of middlewares) {
      const result = middleware(req, res);
      if (result instanceof Promise) {
        await result;
      }
    }
  };
}

export function isAsyncFunction(fn: Function): boolean {
  if (fn.constructor.name === 'AsyncFunction') {
    return true;
  }

  const fnString = fn.toString();
  return (
    fnString.includes('async ') ||
    fnString.includes('Promise') ||
    fnString.includes('await ')
  );
}

export function requiresBodyParsing(method: string): boolean {
  const methodUpper = method.toUpperCase();

  return (
    methodUpper === 'POST' || methodUpper === 'PUT' || methodUpper === 'PATCH'
  );
}
