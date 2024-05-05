import {MuzuServer, Request, HttpException} from '../lib';
import * as request from 'supertest';

const muzuServer = new MuzuServer();
const {Controller, Get, Middleware} = muzuServer;

function Logger() {
  console.log('Logger Middleware');
}

function Auth(req: Request) {
  req.user = {name: 'Muzu User'};
}

function AddId(req: Request) {
  req.userId = '2342';
}

function Admin() {
  throw new HttpException(403, 'Unauthorized');
}

async function AsyncLogger(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Async Logger Middleware');
      resolve();
    }, 300);
  });
}

@Controller('/api')
class TestController {
  @Get('/hello')
  @Middleware(Logger)
  hello() {
    return {message: 'Get Method Called'};
  }

  @Get('/hello-auth')
  @Middleware(Auth)
  helloAuth(req: Request) {
    return {message: `Hello ${req.user.name}`};
  }

  @Get('/hello-admin')
  @Middleware(Admin)
  helloAdmin() {
    return {message: 'Hello Admin'};
  }

  @Get('/hello-auth-id')
  @Middleware(Auth, AddId)
  helloAuthId(req: Request) {
    const {user, userId} = req;

    return {message: `Hello ${user.name}`, userId};
  }

  @Get('/hello-async-logger')
  @Middleware(AsyncLogger)
  helloAsyncLogger() {
    return {message: 'Hello Async Logger'};
  }
}

const port = 3001;
muzuServer.listen(port);

describe('MuzuServer', () => {
  it('should return 200 on GET /api/hello', async () => {
    const res = await request(muzuServer.server).get('/api/hello');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Get Method Called',
      })
    );
  });

  it('should return 200 on GET /api/hello-auth', async () => {
    const res = await request(muzuServer.server).get('/api/hello-auth');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Hello Muzu User',
      })
    );
  });

  it('should return 403 on GET /api/hello-admin', async () => {
    const res = await request(muzuServer.server).get('/api/hello-admin');
    expect(res.status).toBe(403);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 403,
        message: 'Unauthorized',
      })
    );
  });

  it('should return 200 on GET /api/hello-auth-id', async () => {
    const res = await request(muzuServer.server).get('/api/hello-auth-id');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        userId: '2342',
        message: 'Hello Muzu User',
      })
    );
  });

  it('should return 200 on GET /api/hello-async-logger', async () => {
    const res = await request(muzuServer.server).get('/api/hello-async-logger');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: 'Hello Async Logger',
      })
    );
  });
});

muzuServer.stop(() => {
  console.log('Server stopped');
});
