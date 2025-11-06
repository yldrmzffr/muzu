import {RouteManager} from '../routing/route-manager';
import {Route} from '../interfaces';

export type ControllerDecorator = (path?: string) => ClassDecorator;

export class ControllerFactory {
  constructor(private routeManager: RouteManager) {}
  public Controller: ControllerDecorator = (path = '') => {
    return (target: any) => {
      Reflect.defineMetadata('path', path, target);

      const properties = Object.getOwnPropertyNames(target.prototype);

      const routers: (Route | undefined)[] = properties.map(property => {
        const routeHandler = target.prototype[property];
        const method = Reflect.getMetadata('method', routeHandler);
        const url = Reflect.getMetadata('url', routeHandler);
        const middlewares = Reflect.getMetadata('middlewares', routeHandler);
        if (!method || !url) return;

        const fullPath = this.joinPaths(path, url);

        const handlerSource = routeHandler.toString();
        const hasQueryParams =
          handlerSource.includes('req.params') ||
          handlerSource.includes('req.query');

        return {
          method,
          url: fullPath,
          handler: routeHandler.bind(target.prototype),
          middlewares,
          hasQueryParams,
        } as Route;
      });

      this.routeManager.addRoutes(routers.filter(Boolean) as Route[]);

      return target;
    };
  };

  private joinPaths(basePath: string, routePath: string): string {
    const base = basePath.replace(/^\/+|\/+$/g, '');
    const route = routePath.replace(/^\/+|\/+$/g, '');

    if (!base && !route) return '/';
    if (!base) return '/' + route;
    if (!route) return '/' + base;
    return '/' + base + '/' + route;
  }
}
