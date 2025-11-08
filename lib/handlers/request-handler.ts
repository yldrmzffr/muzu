import {HttpStatus} from '../constants/http-status';
import {Request} from '../interfaces';
import {Response} from '../types';
import {RouteManager} from '../routing/route-manager';
import {NotFoundException} from '../exceptions/not-found.exception';
import {getRequestBody} from '../utils';
import {MuzuException} from '../exceptions/muzu.exception';
import {BadRequestException} from '../exceptions/bad-request.exception';
import {ValidationException} from '../exceptions/validation.exception';

const JSON_HEADERS = {'Content-Type': 'application/json'};

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
    res.writeHead(statusCode, JSON_HEADERS);
    res.end(JSON.stringify(body));
  }

  public async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const {url, method} = req;

      const searchResult = this.routeManager.find(url!, method);

      if (!searchResult.metadata) {
        const queryIndex = url!.indexOf('?');
        const path = queryIndex === -1 ? url! : url!.substring(0, queryIndex);
        throw new NotFoundException(`Route ${method} ${path} not found`, {
          method,
          path,
        });
      }

      const {metadata} = searchResult;

      const parsed = metadata.pathParser(url!);
      req.params = {...parsed.queryParams, ...searchResult.params};

      if (metadata.queryValidator && req.params) {
        const queryErrors = metadata.queryValidator(req.params);
        if (queryErrors.length > 0) {
          throw new ValidationException(queryErrors, 'Query validation failed');
        }
      }

      if (metadata.requiresBody) {
        try {
          req.body = await getRequestBody(req);
        } catch (error) {
          const err = error as MuzuException;
          throw new BadRequestException('Error parsing body', err.details);
        }

        if (metadata.bodyValidator && req.body) {
          const bodyErrors = metadata.bodyValidator(req.body);
          if (bodyErrors.length > 0) {
            throw new ValidationException(bodyErrors, 'Body validation failed');
          }
        }
      }
      if (metadata.composedMiddleware) {
        await metadata.composedMiddleware(req, res);
      }

      let result: Object;
      if (metadata.isAsync) {
        result = await metadata.handler(req, res);
      } else {
        result = metadata.handler(req, res);
      }

      const statusCode = res.statusCode || HttpStatus.OK;
      return this.sendResponse(res, statusCode, result);
    } catch (error) {
      const knownError = error as MuzuException;

      if (knownError.kind === 'MuzuException') {
        return this.sendResponse(res, knownError.status, knownError);
      }

      return this.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Internal Server Error',
        stack: knownError.stack,
      });
    }
  }
}
