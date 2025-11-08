export type Middleware = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

export type MiddlewareDecorator = (...middlewares: Function[]) => Middleware;

/**
 * Global Middleware decorator
 * Attaches middleware functions to a route handler
 *
 * @param middlewares - One or more middleware functions
 *
 * @example
 * ```typescript
 * import { Controller, Get, Middleware } from 'muzu';
 *
 * function authMiddleware(req, res) {
 *   // Check authentication
 * }
 *
 * @Controller('/api')
 * export class UserController {
 *   @Get('/users')
 *   @Middleware(authMiddleware)
 *   getUsers() {
 *     return { users: [] };
 *   }
 * }
 * ```
 */
export const Middleware: MiddlewareDecorator = (...middlewares: Function[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('middlewares', middlewares, target[propertyKey]);
    return descriptor;
  };
};

/**
 * @deprecated Use global Middleware decorator instead of factory class
 * Kept for backward compatibility
 */
export class MiddlewareFactory {
  Middleware = Middleware;
}
