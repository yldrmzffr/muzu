export function parseQueryParams(url: string): Record<string, string> {
  const [, queryString] = url.split('?');

  if (!queryString) {
    return {};
  }

  const params = queryString.split('&');

  return params.reduce((acc, param) => {
    if (!param) return acc;

    const [key, value] = param.split('=');

    if (!key) return acc;

    return {
      ...acc,
      [key]: value ? decodeURIComponent(value) : '',
    };
  }, {} as Record<string, string>);
}
