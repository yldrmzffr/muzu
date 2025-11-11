import 'reflect-metadata';

import {createServer, Server, IncomingMessage, ServerResponse} from 'http';
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
import {SwaggerConfig, SwaggerGenerator, generateSwaggerUI} from './swagger';

export {Request, Response, RouteHandler, HttpException};

export interface MuzuServerConfig {
  swagger?: SwaggerConfig;
}

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

// Export Swagger/OpenAPI
export * from './swagger';

export class MuzuServer {
  public readonly server: Server;
  public readonly routeManager: RouteManager;
  public readonly requestHandler: RequestHandler;
  private swaggerConfig?: SwaggerConfig;
  private swaggerSpec?: any;
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

  constructor(config?: MuzuServerConfig | SwaggerConfig) {
    this.routeManager = new RouteManager();
    const methods = new MethodFactory();

    this.Controller = new ControllerFactory(this.routeManager).Controller;
    this.requestHandler = new RequestHandler(this.routeManager);

    const middleware = new MiddlewareFactory();
    this.Middleware = middleware.Middleware;

    this.server = createServer(this.handleRequest.bind(this));

    this.Get = methods.Get;
    this.Post = methods.Post;
    this.Delete = methods.Delete;
    this.Put = methods.Put;
    this.Patch = methods.Patch;

    this.initializeSwagger(config);
  }

  /**
   * Initializes Swagger configuration
   * Supports both old format (direct SwaggerConfig) and new format (MuzuServerConfig)
   */
  private initializeSwagger(config?: MuzuServerConfig | SwaggerConfig): void {
    if (!config) return;

    // Check if it's the new config format (has 'swagger' key)
    const swaggerConfig = this.isServerConfig(config) ? config.swagger : config;

    if (swaggerConfig && swaggerConfig.enabled !== false) {
      this.swaggerConfig = swaggerConfig;
    }
  }

  private isServerConfig(
    config: MuzuServerConfig | SwaggerConfig
  ): config is MuzuServerConfig {
    return 'swagger' in config;
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    // Check and handle Swagger routes
    if (this.swaggerConfig && req.url) {
      const swaggerHandled = this.handleSwaggerRoutes(req, res);
      if (swaggerHandled) return;
    }

    // Pass to normal request handler
    return this.requestHandler.handleRequest(req as Request, res as Response);
  }

  private handleSwaggerRoutes(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    if (!this.swaggerConfig || !req.url) return false;

    const swaggerPath = this.swaggerConfig.path || '/swagger';
    const swaggerJsonPath = `${swaggerPath}.json`;
    const normalizedUrl = this.normalizeSwaggerUrl(req.url);

    // Serve swagger.json
    if (normalizedUrl === swaggerJsonPath) {
      this.serveSwaggerJson(res);
      return true;
    }

    // Serve swagger UI
    if (normalizedUrl === swaggerPath) {
      this.serveSwaggerUI(res, swaggerJsonPath);
      return true;
    }

    return false;
  }

  private normalizeSwaggerUrl(url: string): string {
    return url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
  }

  private serveSwaggerJson(res: ServerResponse): void {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(this.swaggerSpec, null, 2));
  }

  private serveSwaggerUI(res: ServerResponse, swaggerJsonPath: string): void {
    const html = generateSwaggerUI(
      swaggerJsonPath,
      this.swaggerConfig!.info.title
    );
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  }

  private loadControllers(): void {
    const controllers = getRegisteredControllers();
    controllers.forEach(({target, path}) => {
      processController(target, path, this.routeManager);
    });
  }

  /**
   * Generates Swagger/OpenAPI specification
   */
  private generateSwagger(): void {
    if (!this.swaggerConfig) return;

    const generator = new SwaggerGenerator(
      this.swaggerConfig,
      this.routeManager
    );
    this.swaggerSpec = generator.generate();

    const swaggerPath = this.swaggerConfig.path || '/swagger';
    console.log(`📚 Swagger UI available at ${swaggerPath}`);
    console.log(`📄 Swagger JSON available at ${swaggerPath}.json`);
  }

  public listen(port: number, callback?: () => void): void {
    this.loadControllers();
    this.generateSwagger();

    console.log('🚀 Server is listening on port', port);
    this.server.listen(port, callback);
  }

  public stop(callback?: () => void): void {
    this.server.close(callback);
  }
}
