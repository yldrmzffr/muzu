import 'reflect-metadata';
import * as pathLib from 'path';

import {createServer, Server} from 'http';
import {HttpException} from './exceptions/http.exception';

import {Request, Route} from './interfaces';
import {RequestMethod, Response, RouteHandler} from './types';
import {getRequestBody, parseQueryParams} from './utils';
import {MuzuException} from './exceptions/muzu.exception';
import {NotFoundException} from './exceptions/not-found.exception';
import {BadRequestException} from './exceptions/bad-request.exception';
import RouteManager from './route-manager';

export {Request, Response, RouteHandler, HttpException};

export class MuzuServer {
  public readonly server: Server;
  public readonly routeManager: RouteManager;

  constructor() {
    this.routeManager = new RouteManager();
    this.server = createServer(this.handleRequest.bind(this));
  }

  public listen(port: number, callback?: () => void): void {
    console.log('🚀 Server is listening on port', port);
    console.log('📡 Routes', this.routeManager.getRoutes());
    this.server.listen(port, callback);
  }

  public stop(callback?: () => void): void {
    this.server.close(callback);
  }

  private async sendResponse(
    res: Response,
    statusCode: number,
    body: Object
  ): Promise<void> {
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(body));
    console.log('📤 Response', {statusCode, body});
  }

  private async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const {url, method} = req;
      const path = url!.split('?')[0];

      req.params = parseQueryParams(url!);

      const route = await this.routeManager.find(path, method);

      if (!route) {
        throw new NotFoundException(`Route ${method} ${path} not found`, {
          method,
          path,
        });
      }

      try {
        const body = await getRequestBody(req);
        req.body = body;
      } catch (error) {
        console.log('🚨 Error parsing body', error);
        const err = error as MuzuException;
        throw new BadRequestException('Error parsing body', err.details);
      }

      let result: Object = route.handler(req, res);

      if (result instanceof Promise) {
        result = await result;
      }

      const statusCode = res.statusCode || 200;
      return this.sendResponse(res, statusCode, result);
    } catch (error) {
      console.log('🚨 Error handling request', error);
      const knownError = error as MuzuException;

      if (knownError.kind === 'MuzuException') {
        return this.sendResponse(res, knownError.status, knownError);
      }

      return this.sendResponse(res, 500, {
        message: '500 Internal Server Error',
        stack: knownError.stack,
      });
    }
  }

  public HttpMethod(method: RequestMethod, url: string) {
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
      Reflect.defineMetadata('method', method, target[propertyKey]);
      return descriptor;
    };
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

      this.routeManager.addRoutes(routers.filter(Boolean) as Route[]);

      return target;
    };
  };

  Get = (url = '/') => {
    return this.HttpMethod(RequestMethod.GET, url);
  };

  Post = (url = '/') => {
    return this.HttpMethod(RequestMethod.POST, url);
  };

  Delete = (url = '/') => {
    return this.HttpMethod(RequestMethod.DELETE, url);
  };

  Put = (url = '/') => {
    return this.HttpMethod(RequestMethod.PUT, url);
  };

  Patch = (url = '/') => {
    return this.HttpMethod(RequestMethod.PATCH, url);
  };
}
