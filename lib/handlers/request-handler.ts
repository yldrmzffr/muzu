import {Request} from '../interfaces';
import {Response} from '../types';
import {RouteManager} from '../routing/route-manager';
import {NotFoundException} from '../exceptions/not-found.exception';
import {getRequestBody, parseQueryParams} from '../utils';
import {MuzuException} from '../exceptions/muzu.exception';
import {BadRequestException} from '../exceptions/bad-request.exception';

export class RequestHandler {
  private routeManager: RouteManager;

  constructor(routeManager: RouteManager) {
    this.routeManager = routeManager;
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

  public async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const {url, method} = req;
      const path = url!.split('?')[0];

      req.params = parseQueryParams(url!);

      const route = this.routeManager.find(path, method);

      if (!route) {
        throw new NotFoundException(`Route ${method} ${path} not found`, {
          method,
          path,
        });
      }

      try {
        req.body = await getRequestBody(req);
      } catch (error) {
        console.log('🚨 Error parsing body', error);
        const err = error as MuzuException;
        throw new BadRequestException('Error parsing body', err.details);
      }

      if (route.middlewares) {
        for (const middleware of route.middlewares) {
          const result = middleware(req, res);
          if (result instanceof Promise) {
            await result;
          }
        }
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
}
