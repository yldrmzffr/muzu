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

export {Request, Response, RouteHandler, HttpException};

export class MuzuServer {
  public readonly server: Server;
  public readonly routeManager: RouteManager;
  public readonly requestHandler: RequestHandler;
  public readonly Controller: ControllerDecorator;
  public readonly Middleware: MiddlewareDecorator;
  public readonly Get: MethodDecorator;
  public readonly Post: MethodDecorator;
  public readonly Delete: MethodDecorator;
  public readonly Put: MethodDecorator;
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

  public listen(port: number, callback?: () => void): void {
    console.log('🚀 Server is listening on port', port);
    this.server.listen(port, callback);
  }

  public stop(callback?: () => void): void {
    this.server.close(callback);
  }
}
