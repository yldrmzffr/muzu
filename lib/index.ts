import 'reflect-metadata';
import * as pathLib from 'path';

import {createServer, Server} from 'http';

import {Request, Route} from './interfaces';
import {RouteHandler, Response} from './types';
import {parseQueryParams, removeSlash} from './utils';

export {Request, Response, RouteHandler};

export class MuzuServer {
  private readonly routes: Route[];
  private server: Server;

  constructor() {
    this.routes = [];
    this.server = createServer(this.handleRequest.bind(this));
  }

  public addRoute = (route: Route): void => {
    this.routes.push(route);
  };

  public addRoutes = (routes: Route[]): void => {
    this.routes.push(...routes);
  };
  public listen(port: number, callback?: () => void): void {
    console.log('🚀 Server is listening on port', port);
    console.log('📡 Routes', this.routes);
    this.server.listen(port, callback);
  }

  private sendResponse(res: Response, statusCode: number, body: Object): void {
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(body));
    console.log('📤 Response', {statusCode, body});
  }

  private handleRequest(req: Request, res: Response): void {
    const {url, method} = req;
    const path = url!.split('?')[0];

    req.params = parseQueryParams(url!);

    const route = this.routes.find(
      req => req.url === removeSlash(path) && req.method === method
    );

    if (!route) {
      return this.sendResponse(res, 404, {message: '404 Not Found'});
    }

    const result = route.handler(req, res);
    const statusCode = res.statusCode || 200;
    return this.sendResponse(res, statusCode, result);
  }

  Controller = (path = '') => {
    return (target: any) => {
      Reflect.defineMetadata('path', path, target);

      const properties = Object.getOwnPropertyNames(target.prototype);

      const routers: (Route | undefined)[] = properties.map(property => {
        const routeHandler = target.prototype[property];
        const method = Reflect.getMetadata('method', routeHandler);
        const url = Reflect.getMetadata('url', routeHandler);

        if (!method || !url) return;

        const fullPath = pathLib.join(path, url);

        return {
          method,
          url: fullPath,
          handler: routeHandler.bind(target.prototype),
        } as Route;
      });

      this.addRoutes(routers.filter(Boolean) as Route[]);

      return target;
    };
  };

  Get = (url: string) => {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      Reflect.defineMetadata(
        'url',
        `${url}`.toLowerCase(),
        target[propertyKey]
      );
      Reflect.defineMetadata('method', 'GET', target[propertyKey]);
      return descriptor;
    };
  };
}
