import {RouteHandler} from '../types';
import {createNode, NodeType, RouteNode} from './route-node';
import {compilePathParser} from './path-parser';
import {
  RouteMetadata,
  composeMiddlewares,
  isAsyncFunction,
  requiresBodyParsing,
} from './route-metadata';

const PARAM_PREFIX = ':';
const PATH_SEPARATOR = '/';

export interface SearchResult {
  metadata?: RouteMetadata;
  params: Record<string, string>;
}

export class RouteTree {
  private readonly root: RouteNode;

  constructor() {
    this.root = createNode('', NodeType.STATIC);
  }

  public insert(
    path: string,
    handler: RouteHandler,
    middlewares?: Function[],
    method?: string,
    hasQueryParams?: boolean
  ): void {
    const segments = this.splitPathIntoSegments(path);
    const leafNode = this.traverseAndCreateNodes(segments);

    leafNode.metadata = this.compileRouteMetadata(
      handler,
      middlewares,
      method,
      hasQueryParams
    );
  }

  private compileRouteMetadata(
    handler: RouteHandler,
    middlewares?: Function[],
    method?: string,
    hasQueryParams?: boolean
  ): RouteMetadata {
    let queryParamsDetected = hasQueryParams;
    if (queryParamsDetected === undefined) {
      const handlerSource = handler.toString();
      queryParamsDetected =
        handlerSource.includes('req.params') ||
        handlerSource.includes('req.query');
    }

    return {
      handler,
      composedMiddleware: composeMiddlewares(middlewares),
      isAsync: isAsyncFunction(handler),
      requiresBody: method ? requiresBodyParsing(method) : true,
      hasQueryParams: queryParamsDetected,
      pathParser: compilePathParser(queryParamsDetected),
      method: method || 'GET',
    };
  }

  public search(path: string): SearchResult {
    const segments = this.splitPathIntoSegments(path);
    const params: Record<string, string> = {};
    const matchedNode = this.findMatchingNode(this.root, segments, 0, params);

    if (matchedNode) {
      return this.createSuccessResult(matchedNode, params);
    }

    return this.createEmptyResult();
  }

  public getAllRoutes(): Array<{path: string; handler: RouteHandler}> {
    const routes: Array<{path: string; handler: RouteHandler}> = [];
    this.collectRoutes(this.root, '', routes);
    return routes;
  }

  private traverseAndCreateNodes(segments: string[]): RouteNode {
    let currentNode = this.root;

    for (const segment of segments) {
      currentNode = this.getOrCreateChildNode(currentNode, segment);
    }

    return currentNode;
  }

  private getOrCreateChildNode(parent: RouteNode, segment: string): RouteNode {
    if (this.isParamSegment(segment)) {
      return this.getOrCreateParamChild(parent, segment);
    }

    return this.getOrCreateStaticChild(parent, segment);
  }

  private getOrCreateParamChild(parent: RouteNode, segment: string): RouteNode {
    if (!parent.paramChild) {
      const paramName = this.extractParamName(segment);
      parent.paramChild = createNode(segment, NodeType.PARAM, paramName);
    }
    return parent.paramChild;
  }

  private getOrCreateStaticChild(
    parent: RouteNode,
    segment: string
  ): RouteNode {
    let child = parent.children.get(segment);

    if (!child) {
      child = createNode(segment, NodeType.STATIC);
      parent.children.set(segment, child);
    }

    return child;
  }

  private findMatchingNode(
    node: RouteNode,
    segments: string[],
    segmentIndex: number,
    params: Record<string, string>
  ): RouteNode | null {
    if (this.hasMatchedAllSegments(segmentIndex, segments.length)) {
      return this.hasHandler(node) ? node : null;
    }

    const currentSegment = segments[segmentIndex];

    const staticMatch = this.tryStaticMatch(
      node,
      currentSegment,
      segments,
      segmentIndex,
      params
    );
    if (staticMatch) return staticMatch;

    const paramMatch = this.tryParamMatch(
      node,
      currentSegment,
      segments,
      segmentIndex,
      params
    );
    if (paramMatch) return paramMatch;

    return null;
  }

  private tryStaticMatch(
    node: RouteNode,
    segment: string,
    segments: string[],
    index: number,
    params: Record<string, string>
  ): RouteNode | null {
    const staticChild = node.children.get(segment);

    if (!staticChild) {
      return null;
    }

    return this.findMatchingNode(staticChild, segments, index + 1, params);
  }

  private tryParamMatch(
    node: RouteNode,
    segment: string,
    segments: string[],
    index: number,
    params: Record<string, string>
  ): RouteNode | null {
    if (!node.paramChild) {
      return null;
    }

    const paramName = node.paramChild.paramName!;
    params[paramName] = segment;

    const result = this.findMatchingNode(
      node.paramChild,
      segments,
      index + 1,
      params
    );

    if (result) {
      return result;
    }

    delete params[paramName];
    return null;
  }

  private splitPathIntoSegments(path: string): string[] {
    return path
      .split(PATH_SEPARATOR)
      .filter(segment => segment.length > 0)
      .map(segment => this.normalizeSegment(segment));
  }

  private normalizeSegment(segment: string): string {
    if (this.isParamSegment(segment)) {
      return segment;
    }
    return segment.toLowerCase();
  }

  private isParamSegment(segment: string): boolean {
    return segment.startsWith(PARAM_PREFIX);
  }

  private extractParamName(segment: string): string {
    return segment.slice(PARAM_PREFIX.length);
  }

  private createSuccessResult(
    node: RouteNode,
    params: Record<string, string>
  ): SearchResult {
    return {
      metadata: node.metadata,
      params,
    };
  }

  private createEmptyResult(): SearchResult {
    return {params: {}};
  }

  private hasMatchedAllSegments(index: number, totalSegments: number): boolean {
    return index === totalSegments;
  }

  private hasHandler(node: RouteNode): boolean {
    return !!node.metadata;
  }

  private collectRoutes(
    node: RouteNode,
    currentPath: string,
    routes: Array<{path: string; handler: RouteHandler}>
  ): void {
    const path = this.buildPathString(currentPath, node.segment);

    if (node.metadata) {
      routes.push({
        path: path || PATH_SEPARATOR,
        handler: node.metadata.handler,
      });
    }

    node.children.forEach(child => {
      this.collectRoutes(child, path, routes);
    });

    if (node.paramChild) {
      this.collectRoutes(node.paramChild, path, routes);
    }
  }

  private buildPathString(currentPath: string, segment: string): string {
    return currentPath + (segment ? PATH_SEPARATOR + segment : '');
  }
}
