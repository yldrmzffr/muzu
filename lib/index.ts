import 'reflect-metadata';

import {createServer, Server} from 'http';
import {HttpException} from './exceptions/http.exception';

import {Request} from './interfaces';
import {Response, RouteHandler} from './types';
import {RouteManager} from './routing/route-manager';
import {RequestHandler} from './handlers/request-handler';
import {
  ControllerDecorator,
  ControllerFactory,
} from './controller/controller-factory';
import {MethodDecorator, MethodFactory} from './methods/method-factory';
import {MiddlewareDecorator, MiddlewareFactory} from './middleware/middleware';
import {getRegisteredControllers} from './controller/controller-registry';
import {processController} from './controller/controller-processor';

export {Request, Response, RouteHandler, HttpException};

export {
  ValidationException,
  ValidationError,
} from './exceptions/validation.exception';
export * from './validation';
export {HttpStatus} from './constants/http-status';

// Export global decorators
export {Controller} from './controller/controller.decorator';
export {Get, Post, Put, Delete, Patch} from './methods/method-factory';
export {Middleware} from './middleware/middleware';
export {clearRegistry} from './controller/controller-registry';

export class MuzuServer {
  public readonly server: Server;
  public readonly routeManager: RouteManager;
  public readonly requestHandler: RequestHandler;
  /**
   * @deprecated Use global Controller decorator instead: `import { Controller } from 'muzu'`
   */
  public readonly Controller: ControllerDecorator;
  /**
   * @deprecated Use global Middleware decorator instead: `import { Middleware } from 'muzu'`
   */
  public readonly Middleware: MiddlewareDecorator;
  /**
   * @deprecated Use global Get decorator instead: `import { Get } from 'muzu'`
   */
  public readonly Get: MethodDecorator;
  /**
   * @deprecated Use global Post decorator instead: `import { Post } from 'muzu'`
   */
  public readonly Post: MethodDecorator;
  /**
   * @deprecated Use global Delete decorator instead: `import { Delete } from 'muzu'`
   */
  public readonly Delete: MethodDecorator;
  /**
   * @deprecated Use global Put decorator instead: `import { Put } from 'muzu'`
   */
  public readonly Put: MethodDecorator;
  /**
   * @deprecated Use global Patch decorator instead: `import { Patch } from 'muzu'`
   */
  public readonly Patch: MethodDecorator;

  constructor() {
    this.routeManager = new RouteManager();
    const methods = new MethodFactory();

    this.Controller = new ControllerFactory(this.routeManager).Controller;
    this.requestHandler = new RequestHandler(this.routeManager);

    const middleware = new MiddlewareFactory();
    this.Middleware = middleware.Middleware;

    this.server = createServer(
      this.requestHandler.handleRequest.bind(this.requestHandler)
    );

    this.Get = methods.Get;
    this.Post = methods.Post;
    this.Delete = methods.Delete;
    this.Put = methods.Put;
    this.Patch = methods.Patch;
  }

  private loadControllers(): void {
    const controllers = getRegisteredControllers();
    controllers.forEach(({target, path}) => {
      processController(target, path, this.routeManager);
    });
  }

  public listen(port: number, callback?: () => void): void {
    this.loadControllers();

    console.log('🚀 Server is listening on port', port);
    this.server.listen(port, callback);
  }

  public stop(callback?: () => void): void {
    this.server.close(callback);
  }
}
