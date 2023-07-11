import {ServerResponse} from 'http';
import {Request} from '../interfaces';

export type Response = ServerResponse;

export type RouteHandler = (req: Request, res: Response) => string;

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
  PUT = 'PUT',
  PATCH = 'PATCH',
}
