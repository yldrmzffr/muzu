import {RequestMethod} from '../types';

type HttpMethodDecorator = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

export type MethodDecorator = (url?: string) => HttpMethodDecorator;

export class MethodFactory {
  public HttpMethod(method: RequestMethod, url: string): HttpMethodDecorator {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      Reflect.defineMetadata('url', url, target[propertyKey]);
      Reflect.defineMetadata('method', method, target[propertyKey]);
      return descriptor;
    };
  }
  Get = (url = '/'): HttpMethodDecorator => {
    return this.HttpMethod(RequestMethod.GET, url);
  };

  Post = (url = '/'): HttpMethodDecorator => {
    return this.HttpMethod(RequestMethod.POST, url);
  };

  Delete = (url = '/'): HttpMethodDecorator => {
    return this.HttpMethod(RequestMethod.DELETE, url);
  };

  Put = (url = '/'): HttpMethodDecorator => {
    return this.HttpMethod(RequestMethod.PUT, url);
  };

  Patch = (url = '/'): HttpMethodDecorator => {
    return this.HttpMethod(RequestMethod.PATCH, url);
  };
}
