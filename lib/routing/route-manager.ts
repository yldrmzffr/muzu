import {Route} from '../interfaces';
import {RouteTree, SearchResult} from './route-tree';
import {RouteMetadata} from './route-metadata';

export class RouteManager {
  private trees: Map<string, RouteTree>;

  constructor() {
    this.trees = new Map();
  }

  private getOrCreateTree(method: string): RouteTree {
    let tree = this.trees.get(method);
    if (!tree) {
      tree = new RouteTree();
      this.trees.set(method, tree);
    }
    return tree;
  }

  public addRoute(route: Route): void {
    const tree = this.getOrCreateTree(route.method);
    tree.insert(
      route.url,
      route.handler,
      route.middlewares,
      route.method,
      route.hasQueryParams,
      route.bodyValidator,
      route.queryValidator,
      route.originalHandler
    );
  }

  public addRoutes(routes: Route[]): void {
    routes.forEach(route => this.addRoute(route));
  }

  public getRoutes(): Route[] {
    const routes: Route[] = [];
    this.trees.forEach((tree, method) => {
      const treeRoutes = tree.getAllRoutes();
      treeRoutes.forEach(({path, handler}) => {
        routes.push({
          method,
          url: path,
          handler,
        });
      });
    });
    return routes;
  }

  public getRoutesWithMetadata(): Array<{
    method: string;
    path: string;
    handler: Function;
    metadata?: RouteMetadata;
  }> {
    const routes: Array<{
      method: string;
      path: string;
      handler: Function;
      metadata?: RouteMetadata;
    }> = [];

    this.trees.forEach((tree, method) => {
      const treeRoutes = tree.getAllRoutes();
      treeRoutes.forEach(({path, handler, metadata}) => {
        routes.push({
          method,
          path,
          handler,
          metadata,
        });
      });
    });

    return routes;
  }

  public find(url: string, method: string | undefined): SearchResult {
    if (!method) {
      return {params: {}};
    }

    const queryIndex = url.indexOf('?');
    const path = queryIndex === -1 ? url : url.substring(0, queryIndex);

    const tree = this.trees.get(method);
    if (!tree) {
      return {params: {}};
    }

    return tree.search(path);
  }
}
