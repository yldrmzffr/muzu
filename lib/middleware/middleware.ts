export type Middleware = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

export type MiddlewareDecorator = (...middlewares: Function[]) => Middleware;
export class MiddlewareFactory {
  Middleware = (...middlewares: Function[]): Middleware => {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      Reflect.defineMetadata('middlewares', middlewares, target[propertyKey]);
      return descriptor;
    };
  };
}
