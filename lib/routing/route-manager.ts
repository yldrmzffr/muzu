import {Route} from '../interfaces';
import {removeSlash} from '../utils';

export class RouteManager {
  private routeMap: Map<string, Route>;

  constructor() {
    this.routeMap = new Map();
  }

  private getRouteKey(url: string, method: string | undefined): string {
    return `${removeSlash(url)}|${method}`;
  }

  public addRoute(route: Route): void {
    const key = this.getRouteKey(route.url, route.method);
    this.routeMap.set(key, route);
  }

  public addRoutes(routes: Route[]): void {
    routes.forEach(route => this.addRoute(route));
  }

  public getRoutes(): Route[] {
    return Array.from(this.routeMap.values());
  }

  public find(url: string, method: string | undefined): Route | undefined {
    const key = this.getRouteKey(url, method);
    return this.routeMap.get(key);
  }
}
