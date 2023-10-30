import {Route} from './interfaces';
import {removeSlash} from './utils';

export default class RouteManager {
  public routes: Route[];
  constructor() {
    this.routes = [];
  }

  public addRoute(route: Route): void {
    this.routes.push(route);
  }

  public addRoutes(routes: Route[]): void {
    this.routes.push(...routes);
  }

  public async getRoutes(): Promise<Route[]> {
    return this.routes;
  }

  public async find(
    url: string,
    method: string | undefined
  ): Promise<Route | undefined> {
    return this.routes.find(
      req => removeSlash(req.url) === removeSlash(url) && req.method === method
    );
  }
}
