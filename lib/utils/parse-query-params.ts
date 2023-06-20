export function parseQueryParams(url: string): Record<string, string> {
  const [, queryString] = url.split('?');
  const params = queryString?.split('&') || [];

  return params?.reduce((acc, param) => {
    const [key, value] = param.split('=');
    return {...acc, [key]: decodeURIComponent(value)};
  }, {});
}
