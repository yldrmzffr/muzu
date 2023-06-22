import {Request} from '../interfaces';

export async function getRequestBody(
  req: Request
): Promise<Record<string, string>> {
  return new Promise<Record<string, string>>((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: {toString: () => string}) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const jsonBody = body ? JSON.parse(body) : {};
        resolve(jsonBody);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (err: any) => {
      reject(err);
    });
  });
}
