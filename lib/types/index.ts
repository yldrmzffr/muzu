import {ServerResponse} from 'http';
import {Request} from '../interfaces';

export type Response = ServerResponse;

export type RouteHandler = (req: Request, res: Response) => string;
