import {RouteManager} from '../routing/route-manager';
import {Route} from '../interfaces';
import {getValidationMetadata, compileValidator} from '../validation';

export function processController(
  target: any,
  basePath: string,
  routeManager: RouteManager
): void {
  const properties = Object.getOwnPropertyNames(target.prototype);

  const routes: (Route | undefined)[] = properties.map(property => {
    const routeHandler = target.prototype[property];
    const method = Reflect.getMetadata('method', routeHandler);
    const url = Reflect.getMetadata('url', routeHandler);
    const middlewares = Reflect.getMetadata('middlewares', routeHandler);

    if (!method || !url) return;

    const fullPath = joinPaths(basePath, url);

    const handlerSource = routeHandler.toString();
    const hasQueryParams =
      handlerSource.includes('req.params') ||
      handlerSource.includes('req.query');

    const validationMeta = getValidationMetadata(target.prototype, property);
    let bodyValidator;
    let queryValidator;

    if (validationMeta.bodyDto) {
      try {
        bodyValidator = compileValidator(validationMeta.bodyDto);
      } catch (error) {
        console.warn(
          `⚠️  Failed to compile body validator for ${method.toUpperCase()} ${fullPath}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    if (validationMeta.queryDto) {
      try {
        queryValidator = compileValidator(validationMeta.queryDto);
      } catch (error) {
        console.warn(
          `⚠️  Failed to compile query validator for ${method.toUpperCase()} ${fullPath}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return {
      method,
      url: fullPath,
      handler: routeHandler.bind(target.prototype),
      middlewares,
      hasQueryParams,
      bodyValidator,
      queryValidator,
    } as Route;
  });

  routeManager.addRoutes(routes.filter(Boolean) as Route[]);
}

function joinPaths(basePath: string, routePath: string): string {
  const base = basePath.replace(/^\/+|\/+$/g, '');
  const route = routePath.replace(/^\/+|\/+$/g, '');

  if (!base && !route) return '/';
  if (!base) return '/' + route;
  if (!route) return '/' + base;
  return '/' + base + '/' + route;
}
