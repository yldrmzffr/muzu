import {MuzuServer, clearRegistry} from '../lib';
import * as request from 'supertest';

const muzuServer = new MuzuServer();
const {Controller, Get} = muzuServer;

@Controller('/legacy')
class LegacyController {
  private greeting = 'hello';

  @Get('/greet')
  greet() {
    return {message: this.greeting};
  }
}

muzuServer.listen(3010);

describe('Legacy instance decorators', () => {
  afterAll(() => {
    clearRegistry();
    muzuServer.stop();
  });

  it('should call handler with controller instance', async () => {
    const res = await request(muzuServer.server).get('/legacy/greet');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({message: 'hello'});
  });
});
