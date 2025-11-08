import {
  MuzuServer,
  Request,
  Controller,
  Get,
  Post,
  clearRegistry,
} from '../lib';
import * as request from 'supertest';

@Controller('api')
class ParamsController {
  @Get('path-params/:userId/:postId')
  pathParams(req: Request) {
    return {
      userId: req.params?.userId,
      postId: req.params?.postId,
    };
  }

  @Get('query-params')
  queryParams(req: Request) {
    return {
      params: req.params,
    };
  }

  @Get('mixed/:id')
  mixedParams(req: Request) {
    return {
      pathParam: req.params?.id,
      queryParams: {
        filter: req.params?.filter,
        sort: req.params?.sort,
        page: req.params?.page,
      },
      allParams: req.params,
    };
  }

  @Post('post-with-query')
  postWithQuery(req: Request) {
    return {
      body: req.body,
      queryParams: req.params,
    };
  }
}

const muzuServer = new MuzuServer();
const port = 3003;
muzuServer.listen(port);

afterAll(() => {
  clearRegistry();
});

describe('Path Parameters', () => {
  it('should extract single path parameter', async () => {
    const res = await request(muzuServer.server).get(
      '/api/path-params/123/456'
    );
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      userId: '123',
      postId: '456',
    });
  });

  it('should handle path parameters with special characters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/path-params/user-123/post_456'
    );
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      userId: 'user-123',
      postId: 'post_456',
    });
  });

  it('should handle numeric path parameters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/path-params/999/777'
    );
    expect(res.status).toEqual(200);
    expect(res.body.userId).toBe('999');
    expect(res.body.postId).toBe('777');
  });

  it('should handle alphanumeric path parameters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/path-params/abc123/xyz789'
    );
    expect(res.status).toEqual(200);
    expect(res.body.userId).toBe('abc123');
    expect(res.body.postId).toBe('xyz789');
  });
});

describe('Query Parameters', () => {
  it('should parse single query parameter', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?name=john'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params).toEqual({
      name: 'john',
    });
  });

  it('should parse multiple query parameters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?name=john&age=30&city=NYC'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params).toEqual({
      name: 'john',
      age: '30',
      city: 'NYC',
    });
  });

  it('should handle query parameters with special characters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?email=john%40example.com&message=hello%20world'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params.email).toBe('john@example.com');
    expect(res.body.params.message).toBe('hello world');
  });

  it('should handle empty query parameter values', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?name=&age=30'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params).toEqual({
      name: '',
      age: '30',
    });
  });

  it('should handle query parameters without values', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?debug&verbose'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params).toEqual({
      debug: '',
      verbose: '',
    });
  });

  it('should handle numeric query parameters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?page=1&limit=10&offset=50'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params).toEqual({
      page: '1',
      limit: '10',
      offset: '50',
    });
  });

  it('should handle boolean-like query parameters', async () => {
    const res = await request(muzuServer.server).get(
      '/api/query-params?active=true&deleted=false'
    );
    expect(res.status).toEqual(200);
    expect(res.body.params).toEqual({
      active: 'true',
      deleted: 'false',
    });
  });
});

describe('Mixed Path and Query Parameters', () => {
  it('should handle both path and query parameters together', async () => {
    const res = await request(muzuServer.server).get(
      '/api/mixed/123?filter=active&sort=desc&page=2'
    );
    expect(res.status).toEqual(200);
    expect(res.body.pathParam).toBe('123');
    expect(res.body.queryParams).toEqual({
      filter: 'active',
      sort: 'desc',
      page: '2',
    });
    expect(res.body.allParams).toEqual({
      id: '123',
      filter: 'active',
      sort: 'desc',
      page: '2',
    });
  });

  it('should handle path parameter without query parameters', async () => {
    const res = await request(muzuServer.server).get('/api/mixed/456');
    expect(res.status).toEqual(200);
    expect(res.body.pathParam).toBe('456');
    expect(res.body.allParams.id).toBe('456');
  });

  it('should prioritize path parameters over query parameters with same name', async () => {
    const res = await request(muzuServer.server).get('/api/mixed/789?id=999');
    expect(res.status).toEqual(200);
    expect(res.body.pathParam).toBe('789');
    expect(res.body.allParams.id).toBe('789');
  });
});

describe('Query Parameters with POST requests', () => {
  it('should handle query parameters in POST request', async () => {
    const res = await request(muzuServer.server)
      .post('/api/post-with-query?userId=123&token=abc')
      .send({name: 'John', email: 'john@example.com'});

    expect(res.status).toEqual(200);
    expect(res.body.body).toEqual({
      name: 'John',
      email: 'john@example.com',
    });
    expect(res.body.queryParams).toEqual({
      userId: '123',
      token: 'abc',
    });
  });

  it('should handle POST request with only body (no query params)', async () => {
    const res = await request(muzuServer.server)
      .post('/api/post-with-query')
      .send({data: 'test'});

    expect(res.status).toEqual(200);
    expect(res.body.body).toEqual({data: 'test'});
  });
});

muzuServer.stop(() => {
  console.log('Params test server stopped');
});
