import {RouteManager} from '../routing/route-manager';
import * as pathLib from 'path';
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
}
