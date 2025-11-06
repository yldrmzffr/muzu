import {RouteMetadata} from './route-metadata';

export enum NodeType {
  STATIC = 'static',
  PARAM = 'param',
}

export interface RouteNode {
  segment: string;
  type: NodeType;
  paramName?: string;
  children: Map<string, RouteNode>;
  paramChild?: RouteNode;
  metadata?: RouteMetadata;
}

export function createNode(
  segment: string,
  type: NodeType = NodeType.STATIC,
  paramName?: string
): RouteNode {
  return {
    segment,
    type,
    paramName,
    children: new Map(),
  };
}
