import {RequestMethod} from '../types';

type HttpMethodDecorator = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

export type MethodDecorator = (url?: string) => HttpMethodDecorator;

function createHttpMethodDecorator(
  method: RequestMethod,
  url: string
): HttpMethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('url', url, target[propertyKey]);
    Reflect.defineMetadata('method', method, target[propertyKey]);
    return descriptor;
  };
}

/**
 * Global GET method decorator
 * @param url - Route path (default: '/')
 */
export const Get: MethodDecorator = (url = '/') => {
  return createHttpMethodDecorator(RequestMethod.GET, url);
};

/**
 * Global POST method decorator
 * @param url - Route path (default: '/')
 */
export const Post: MethodDecorator = (url = '/') => {
  return createHttpMethodDecorator(RequestMethod.POST, url);
};

/**
 * Global DELETE method decorator
 * @param url - Route path (default: '/')
 */
export const Delete: MethodDecorator = (url = '/') => {
  return createHttpMethodDecorator(RequestMethod.DELETE, url);
};

/**
 * Global PUT method decorator
 * @param url - Route path (default: '/')
 */
export const Put: MethodDecorator = (url = '/') => {
  return createHttpMethodDecorator(RequestMethod.PUT, url);
};

/**
 * Global PATCH method decorator
 * @param url - Route path (default: '/')
 */
export const Patch: MethodDecorator = (url = '/') => {
  return createHttpMethodDecorator(RequestMethod.PATCH, url);
};

/**
 * @deprecated Use global decorators instead of factory class
 * Kept for backward compatibility
 */
export class MethodFactory {
  public HttpMethod(method: RequestMethod, url: string): HttpMethodDecorator {
    return createHttpMethodDecorator(method, url);
  }
  Get = Get;
  Post = Post;
  Delete = Delete;
  Put = Put;
  Patch = Patch;
}
