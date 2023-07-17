import {MuzuServer, Request} from '../lib';
import * as request from 'supertest';

const muzuServer = new MuzuServer();
const {Controller, Get, Post, Delete, Put, Patch} = muzuServer;
@Controller('/api')
class TestController {
  @Get('/hello')
  hello() {
    return {message: 'Get Method Called'};
  }

  @Post('/hello')
  helloPost(req: Request) {
    const name = req.body?.name;
    return {message: 'Post Method Called', name};
  }

  @Delete('/hello')
  helloDelete() {
    return {message: 'Delete Method Called'};
  }

  @Put('/hello')
  helloPut() {
    return {message: 'Put Method Called'};
  }

  @Patch('/hello')
  helloPatch() {
    return {message: 'Patch Method Called'};
  }
}

const port = 3000;
muzuServer.listen(port);

describe('MuzuServer', () => {
  it('should return 200 on GET /api/hello', async () => {
    const res = await request(muzuServer.server).get('/api/hello');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({message: 'Get Method Called'});
  });

  it('should return 200 on POST /api/hello', async () => {
    const res = await request(muzuServer.server)
      .post('/api/hello')
      .send({name: 'Muzu'});
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({message: 'Post Method Called', name: 'Muzu'});
  });

  it('should return 200 on DELETE /api/hello', async () => {
    const res = await request(muzuServer.server).delete('/api/hello');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({message: 'Delete Method Called'});
  });

  it('should return 200 on PUT /api/hello', async () => {
    const res = await request(muzuServer.server).put('/api/hello');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({message: 'Put Method Called'});
  });

  it('should return 200 on PATCH /api/hello', async () => {
    const res = await request(muzuServer.server).patch('/api/hello');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({message: 'Patch Method Called'});
  });

  it('should return 404 on GET /api/hello/world', async () => {
    const res = await request(muzuServer.server).get('/api/hello/world');
    expect(res.status).toEqual(404);
    expect(res.body).toEqual({
      kind: 'MuzuException',
      message: 'Route GET /api/hello/world not found',
      status: 404,
      details: {
        method: 'GET',
        path: '/api/hello/world',
      },
    });
  });

  it('should return 400 on POST /api/hello', async () => {
    const res = await request(muzuServer.server)
      .post('/api/hello')
      .send('Not a JSON');
    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      kind: 'MuzuException',
      message: 'Error parsing body',
      status: 400,
    });
  });
});

muzuServer.stop(() => {
  console.log('Server stopped');
});
