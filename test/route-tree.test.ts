import {MuzuServer, Request} from '../lib';
import * as request from 'supertest';

const muzuServer = new MuzuServer();
const {Post, Get, Controller} = muzuServer;

@Controller('users')
class UserController {
  @Get(':id')
  getUser(req: Request) {
    const allParams = req.params || {};
    return {
      userId: allParams.id,
      params: allParams,
    };
  }

  @Get(':id/posts')
  getUserPosts(req: Request) {
    return {
      userId: req.params?.id,
      posts: [],
    };
  }

  @Post(':id/posts/:postId')
  getUserPost(req: Request) {
    return {
      userId: req.params?.id,
      postId: req.params?.postId,
    };
  }

  @Get()
  getAllUsers() {
    return {
      users: [],
    };
  }
}

@Controller('posts')
class PostController {
  @Get(':postId/comments/:commentId')
  getComment(req: Request) {
    return {
      postId: req.params?.postId,
      commentId: req.params?.commentId,
    };
  }
}

const port = 3002;
muzuServer.listen(port);

describe('RouteTree Routing with Path Parameters', () => {
  it('should match static route', async () => {
    const res = await request(muzuServer.server).get('/users');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({users: []});
  });

  it('should match route with single path parameter', async () => {
    const res = await request(muzuServer.server).get('/users/123');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({userId: '123', params: {id: '123'}});
  });

  it('should match route with path parameter and static segment', async () => {
    const res = await request(muzuServer.server).get('/users/456/posts');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({userId: '456', posts: []});
  });

  it('should match route with multiple path parameters', async () => {
    const res = await request(muzuServer.server)
      .post('/users/789/posts/abc')
      .send({});
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({userId: '789', postId: 'abc'});
  });

  it('should match route with multiple path parameters in different controller', async () => {
    const res = await request(muzuServer.server).get(
      '/posts/post123/comments/comment456'
    );
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({postId: 'post123', commentId: 'comment456'});
  });

  it('should handle query parameters alongside path parameters', async () => {
    const res = await request(muzuServer.server).get(
      '/users/999?filter=active&page=1&limit=10'
    );
    expect(res.status).toEqual(200);
    expect(res.body.userId).toBe('999');
    expect(res.body.params).toEqual({
      id: '999',
      filter: 'active',
      page: '1',
      limit: '10',
    });
  });
});

muzuServer.stop(() => {
  console.log('Server stopped');
});
