import {
  MuzuServer,
  Request,
  Response,
  IsString,
  IsEmail,
  MinLength,
  Min,
  Max,
  IsArray,
  ArrayItem,
  ValidateBody,
  ValidateQuery,
  IsInt,
  IsOptional,
  Controller,
  Post,
  Get,
  clearRegistry,
} from '../lib';
import * as request from 'supertest';

class CreateUserDto {
  @IsString()
  @MinLength(3)
  username = '';

  @IsEmail()
  email = '';

  @IsInt()
  @Min(18)
  @Max(100)
  age = 0;
}

class QueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  page?: string;
}

class TagDto {
  @IsString()
  name = '';
}

class PostDto {
  @IsString()
  @MinLength(5)
  title = '';

  @IsArray()
  @ArrayItem(() => TagDto)
  tags: TagDto[] = [];
}

@Controller('/validation')
class ValidationController {
  @Post('/user')
  @ValidateBody(CreateUserDto)
  createUser(req: Request, _res: Response) {
    return {success: true, user: req.body};
  }

  @Get('/search')
  @ValidateQuery(QueryDto)
  search(req: Request, _res: Response) {
    return {success: true, query: req.params};
  }

  @Post('/post')
  @ValidateBody(PostDto)
  createPost(req: Request, _res: Response) {
    return {success: true, post: req.body};
  }

  @Post('/no-validation')
  noValidation(req: Request, _res: Response) {
    return {success: true, body: req.body};
  }
}

const muzuServer = new MuzuServer();
const port = 3002;
muzuServer.listen(port);

describe('Validation System', () => {
  afterAll(() => {
    clearRegistry();
    muzuServer.stop();
  });
  describe('Body Validation', () => {
    it('should accept valid user data', async () => {
      const validUser = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25,
      };

      const response = await request(muzuServer.server)
        .post('/validation/user')
        .send(validUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid username (too short)', async () => {
      const invalidUser = {
        username: 'ab',
        email: 'john@example.com',
        age: 25,
      };

      const response = await request(muzuServer.server)
        .post('/validation/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Body validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].field).toBe('username');
      expect(response.body.errors[0].constraint).toBe('minLength');
    });

    it('should reject invalid email', async () => {
      const invalidUser = {
        username: 'john_doe',
        email: 'not-an-email',
        age: 25,
      };

      const response = await request(muzuServer.server)
        .post('/validation/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toBe('email');
      expect(response.body.errors[0].constraint).toBe('isEmail');
    });

    it('should reject invalid age (too young)', async () => {
      const invalidUser = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 16,
      };

      const response = await request(muzuServer.server)
        .post('/validation/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toBe('age');
      expect(response.body.errors[0].constraint).toBe('min');
    });

    it('should reject invalid age (too old)', async () => {
      const invalidUser = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 150,
      };

      const response = await request(muzuServer.server)
        .post('/validation/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toBe('age');
      expect(response.body.errors[0].constraint).toBe('max');
    });
  });

  describe('Query Validation', () => {
    it('should accept valid query params', async () => {
      const response = await request(muzuServer.server).get(
        '/validation/search?search=test&page=1'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept missing optional params', async () => {
      const response = await request(muzuServer.server).get(
        '/validation/search'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Array Validation', () => {
    it('should accept valid array data', async () => {
      const validPost = {
        title: 'Hello World',
        tags: [{name: 'tech'}, {name: 'programming'}],
      };

      const response = await request(muzuServer.server)
        .post('/validation/post')
        .send(validPost);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid title (too short)', async () => {
      const invalidPost = {
        title: 'Hi',
        tags: [{name: 'tech'}],
      };

      const response = await request(muzuServer.server)
        .post('/validation/post')
        .send(invalidPost);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toBe('title');
      expect(response.body.errors[0].constraint).toBe('minLength');
    });

    it('should reject invalid array item', async () => {
      const invalidPost = {
        title: 'Hello World',
        tags: [{name: 'tech'}, {name: 123}],
      };

      const response = await request(muzuServer.server)
        .post('/validation/post')
        .send(invalidPost);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toContain('tags[');
      expect(response.body.errors[0].constraint).toBe('isString');
    });

    it('should reject non-array value', async () => {
      const invalidPost = {
        title: 'Hello World',
        tags: 'not-an-array',
      };

      const response = await request(muzuServer.server)
        .post('/validation/post')
        .send(invalidPost);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toBe('tags');
      expect(response.body.errors[0].constraint).toBe('isArray');
    });
  });

  describe('No Validation Route', () => {
    it('should accept any data when no validation decorator', async () => {
      const anyData = {
        random: 'data',
        number: 123,
        nested: {key: 'value'},
      };

      const response = await request(muzuServer.server)
        .post('/validation/no-validation')
        .send(anyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
