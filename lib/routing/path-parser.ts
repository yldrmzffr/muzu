export interface ParsedPath {
  path: string;
  queryParams: Record<string, string>;
}

export function compilePathParser(hasQueryParams: boolean): PathParser {
  if (!hasQueryParams) {
    return (url: string): ParsedPath => {
      const queryIndex = url.indexOf('?');
      return {
        path: queryIndex === -1 ? url : url.substring(0, queryIndex),
        queryParams: {},
      };
    };
  }

  return (url: string): ParsedPath => {
    const queryIndex = url.indexOf('?');

    if (queryIndex === -1) {
      return {
        path: url,
        queryParams: {},
      };
    }

    const path = url.substring(0, queryIndex);
    const queryString = url.substring(queryIndex + 1);

    return {
      path,
      queryParams: parseQueryString(queryString),
    };
  };
}

export type PathParser = (url: string) => ParsedPath;

function parseQueryString(queryString: string): Record<string, string> {
  if (!queryString) {
    return {};
  }

  const params: Record<string, string> = {};
  const pairs = queryString.split('&');

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (!pair) continue;

    const equalsIndex = pair.indexOf('=');

    if (equalsIndex === -1) {
      params[pair] = '';
      continue;
    }

    const key = pair.substring(0, equalsIndex);
    const value = pair.substring(equalsIndex + 1);

    if (key) {
      params[key] = value ? decodeURIComponent(value) : '';
    }
  }

  return params;
}
