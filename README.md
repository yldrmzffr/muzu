# Muzu: High-Performance TypeScript HTTP Framework

**Muzu** is a blazingly fast, zero-dependency TypeScript HTTP framework for Node.js. Built with performance in mind, Muzu uses decorator-based routing, build-time compilation, and aggressive optimizations to deliver exceptional request handling speed.

## Features

- 🚀 **Ultra Fast** - Radix tree routing with O(k) lookup complexity
- 🎯 **Zero Dependencies** - Only `reflect-metadata` required for decorators
- 🏗️ **Build-Time Compilation** - Validators and middleware compiled at startup
- 🎨 **Decorator-Based** - Clean, intuitive API using TypeScript decorators
- ✅ **Built-in Validation** - Fast, compile-time validated request schemas
- 🛡️ **Type-Safe** - Full TypeScript support with excellent IDE integration
- 🔌 **Middleware Support** - Composable middleware with zero runtime overhead
- 📚 **OpenAPI/Swagger** - Auto-generated API documentation from decorators
- 📦 **Lightweight** - Minimal footprint, maximum performance

## Installation

To incorporate Muzu into your project, you can easily install it via npm using the following command:

```shell
npm install muzu
```

### TypeScript Configuration

Muzu requires TypeScript decorators to be enabled. Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2022",
    "module": "commonjs"
  }
}
```

## Usage

Here is an in-depth example demonstrating how to leverage the capabilities of Muzu in your application:

```typescript
import { MuzuServer, Controller, Post, Request, Response } from 'muzu';

// Define your controller using decorators
// Controllers are automatically registered when decorators execute
@Controller('auth')
class TestController {

  @Post('login')
  login(req: Request, res: Response) {
    const { username, password } = req.body;

    // Implement your login logic here

    return {
      status: true
    };
  }

}

// Create server instance and start listening
// Controllers are automatically loaded when listen() is called
const app = new MuzuServer();
app.listen(8080);
```

In this example, we import the `Controller` and `Post` decorators directly from `muzu` and use them to define routes. The `@Controller` decorator marks a class as a controller and sets the base path for all routes in that class. The `@Post` decorator defines a route for handling POST requests at the '/login' endpoint.

Controllers are automatically registered when their decorators execute, and they're loaded into the server when `listen()` is called.

You can also handle other HTTP methods by using decorators such as `@Get`, `@Put`, `@Delete`, and `@Patch` accordingly.

## Path Parameters

Muzu supports dynamic path parameters in your routes. You can define path parameters by prefixing a segment with `:` in your route path. Here's an example:

```typescript
import { MuzuServer, Controller, Get, Request, Response } from 'muzu';

@Controller('users')
class UserController {

  @Get(':id')
  getUser(req: Request, res: Response) {
    const userId = req.params.id;

    // Fetch user by ID
    return {
      userId,
      name: 'John Doe'
    };
  }

  @Get(':userId/posts/:postId')
  getUserPost(req: Request, res: Response) {
    const { userId, postId } = req.params;

    // Fetch specific post for a user
    return {
      userId,
      postId,
      title: 'My Post'
    };
  }

}

const app = new MuzuServer();
app.listen(8080);
```

In this example:
- `GET /users/123` will match the `getUser` route with `req.params.id = '123'`
- `GET /users/123/posts/456` will match the `getUserPost` route with `req.params = { userId: '123', postId: '456' }`

## Query Parameters

Muzu automatically parses query parameters from the URL and makes them available through `req.params`. Query parameters are merged with path parameters for convenient access:

```typescript
import { MuzuServer, Controller, Get, Request, Response } from 'muzu';

@Controller('products')
class ProductController {

  @Get()
  getProducts(req: Request, res: Response) {
    const { page, limit, sort } = req.params;

    // Use query parameters for pagination and sorting
    return {
      page: page || '1',
      limit: limit || '10',
      sort: sort || 'desc',
      products: []
    };
  }

  @Get(':id')
  getProduct(req: Request, res: Response) {
    const { id, includeReviews, includeImages } = req.params;

    // Path parameter 'id' and query parameters are both available in req.params
    return {
      id,
      includeReviews: includeReviews === 'true',
      includeImages: includeImages === 'true',
      product: {}
    };
  }

}

const app = new MuzuServer();
app.listen(8080);
```

Examples:
- `GET /products?page=2&limit=20&sort=asc` - All query params available in `req.params`
- `GET /products/123?includeReviews=true&includeImages=false` - Both path param `id` and query params available
- **Note:** If a path parameter and query parameter have the same name, the path parameter takes precedence

## Middleware

Muzu supports middleware functions that can be applied to routes to execute specific logic before the route handler. Middleware functions can be used for tasks such as logging, authentication, and data validation.
`@Middleware` decorator can be used to apply middleware functions to specific routes. Let's see an example:

```typescript
import { MuzuServer, Controller, Post, Middleware, Request, Response, HttpException } from 'muzu';

// Create Middleware Functions
function LoggerMiddleware(req: Request) {
  console.log(`Request Received: ${req.url}`);
}

function AuthMiddleware(req: Request) {
  const { token } = req.headers;

  if (!token) {
    throw new HttpException('Unauthorized', 401);
  }

  const user = getUserFromToken(token);

  // You can attach custom data to the request object
  req.user = user;
}

@Controller('auth')
class TestController {

  @Post('login')
  @Middleware(AuthMiddleware, LoggerMiddleware) // Apply Middleware to the 'login' route
  login(req: Request, res: Response) {
    const { user } = req; // Access the objects attached by the middleware

    // Implement your login logic here

    return {
      status: true
    };
  }

}

// Create server instance and start listening
const app = new MuzuServer();
app.listen(8080);
```

## Exception Handling

Muzu provides a comprehensive exception handling mechanism. You can create custom exception classes by extending the `HttpException` class and utilize them within your application. Let's see an example:

```typescript
import { MuzuServer, Controller, Get, Request, Response, HttpException } from 'muzu';

// Custom Exception Class
class UserNotFoundException extends HttpException {
  constructor(details?: string) {
    super('User Not Found!', 404, details);
  }
}

@Controller('auth')
class TestController {

  @Get('user')
  getUser(req: Request, res: Response) {
    const username = req.body.username;

    // Throw a UserNotFoundException
    throw new UserNotFoundException({
      username
    });

    // The code below will not be executed because an exception is thrown.

    return {
      status: true
    };
  }

}

const app = new MuzuServer();
app.listen(8080);
```

In this example, we create a custom exception class `UserNotFoundException` that extends the `HttpException` class. Inside the `getUser` method of the `TestController` class, we throw an instance of this custom exception class. The thrown exception will be automatically caught and handled by the `handleException` method of the `MuzuServer` instance.

### Exception Response

When an exception is thrown and caught, Muzu automatically generates an exception response with relevant details. Here is an example response for the `UserNotFoundException`:

```json
{
  "status": 404,
  "message": "User Not Found!",
  "details": {
    "username": "muzu"
  }
}
```

## Request Validation

Muzu provides a powerful, zero-dependency validation system with build-time compilation for maximum performance. Validators are compiled at application startup, eliminating runtime overhead.

### Basic Validation

Define DTOs using decorators and apply them to your routes:

```typescript
import {
  MuzuServer,
  Controller,
  Post,
  Request,
  Response,
  ValidateBody,
  IsString,
  IsEmail,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength
} from 'muzu';

// Define a DTO class with validation decorators
class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;
}

@Controller('users')
class UserController {

  @Post()
  @ValidateBody(CreateUserDto)
  createUser(req: Request, res: Response) {
    // If validation passes, req.body is guaranteed to be valid
    const { username, email, age } = req.body;

    return {
      id: '123',
      username,
      email,
      age
    };
  }

}

const app = new MuzuServer();
app.listen(8080);
```

### Query Parameter Validation

```typescript
import { Controller, Get, ValidateQuery, IsString, IsNumber, Min, Max, MinLength } from 'muzu';

class SearchQueryDto {
  @IsString()
  @MinLength(1)
  query: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsString()
  sort?: string;
}

@Controller('search')
class SearchController {

  @Get()
  @ValidateQuery(SearchQueryDto)
  search(req: Request, res: Response) {
    const { query, limit, sort } = req.params;

    return {
      results: [],
      query,
      limit: limit || 10
    };
  }

}
```

### Available Validators

**Type Validators:**
- `@IsString()` - Validates string type
- `@IsNumber()` - Validates number type (excludes NaN)
- `@IsBoolean()` - Validates boolean type
- `@IsDate()` - Validates Date instance
- `@IsInt()` - Validates integer numbers

**String Validators:**
- `@MinLength(length)` - Minimum string length
- `@MaxLength(length)` - Maximum string length
- `@IsEmail()` - Validates email format
- `@IsUrl()` - Validates URL format
- `@IsUUID()` - Validates UUID format
- `@Matches(pattern)` - Validates against custom regex

**Number Validators:**
- `@Min(value)` - Minimum number value
- `@Max(value)` - Maximum number value
- `@IsPositive()` - Must be positive (> 0)
- `@IsNegative()` - Must be negative (< 0)

**Array Validators:**
- `@IsArray()` - Validates array type
- `@ArrayMinSize(size)` - Minimum array length
- `@ArrayMaxSize(size)` - Maximum array length
- `@ArrayItem(DtoClass)` - Validates array items against DTO

**Other Validators:**
- `@IsOptional()` - Field is optional
- `@IsRequired()` - Field is required
- `@IsEnum(enumObject)` - Validates against enum values

### Array Validation Example

```typescript
import {
  Controller,
  Post,
  ValidateBody,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayItem,
  MinLength
} from 'muzu';

class TagDto {
  @IsString()
  @MinLength(1)
  name: string;
}

class CreatePostDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayItem(() => TagDto)
  tags: TagDto[];
}

@Controller('posts')
class PostController {

  @Post()
  @ValidateBody(CreatePostDto)
  createPost(req: Request, res: Response) {
    const { title, tags } = req.body;

    return {
      id: '123',
      title,
      tags
    };
  }

}
```

### Validation Error Response

When validation fails, Muzu returns a detailed error response:

```json
{
  "status": 400,
  "message": "Body validation failed",
  "kind": "MuzuException",
  "errors": [
    {
      "field": "username",
      "constraint": "minLength",
      "value": "ab",
      "message": "username must be at least 3 characters"
    },
    {
      "field": "email",
      "constraint": "isEmail",
      "value": "not-an-email",
      "message": "email must be a valid email"
    },
    {
      "field": "age",
      "constraint": "min",
      "value": 15,
      "message": "age must be at least 18"
    }
  ]
}
```

### Performance

Muzu's validation system is designed for maximum performance:
- **Build-time compilation** - Validators are compiled to optimized functions at startup
- **Zero runtime dependencies** - Pure inline validation checks
- **No function call overhead** - Direct type checks and inline regex
- **Single-pass validation** - All constraints checked in one iteration

## Swagger/OpenAPI Documentation

Muzu provides built-in Swagger/OpenAPI 3.0 documentation support with zero external dependencies. Generate interactive API documentation automatically from your decorators.

### Setup

Enable Swagger by passing configuration to MuzuServer:

```typescript
import { MuzuServer } from 'muzu';

const app = new MuzuServer({
  swagger: {
    enabled: true,
    path: '/swagger',           // Swagger UI path (default: /swagger)
    debug: true,                // Enable debug logs (optional)
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [                  // Optional server definitions
      {
        url: 'http://localhost:3000', 
        description: 'Development server'
      }
    ]
  }
});

app.listen(3000);
```

### Documenting APIs with Decorators

Use Swagger decorators to document your API endpoints:

```typescript
import {
  Controller,
  Get,
  Post,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParameter,
  ApiBody,
  ValidateBody,
  IsString,
  IsEmail,
  IsNumber,
  Min,
  Max
} from 'muzu';

// Define DTOs for request/response
class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;
}

class UserResponseDto {
  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsNumber()
  age: number;
}
```

#### Available Swagger Decorators

**@ApiTags** - Tag controller or method (supports description):
```typescript
// Simple string tags
@ApiTags('Users', 'Authentication')

// Tags with descriptions
@ApiTags(
  { name: 'Users', description: 'User management endpoints' },
  { name: 'Auth', description: 'Authentication endpoints' }
)
```

**@ApiOperation** - Document operation details:
```typescript
@ApiOperation({
  summary: 'Create a new user',
  description: 'Creates a new user with the provided information',
  operationId: 'createUser'  // Optional unique identifier
})
```

**@ApiResponse** - Document response types:
```typescript
@ApiResponse({
  status: 200,
  description: 'Successful response',
  type: UserResponseDto,     // DTO class
  isArray: false             // Set to true for array responses
})

@ApiResponse({
  status: 400,
  description: 'Invalid input'
})
```

**@ApiParameter** - Document path/query/header parameters:
```typescript
@ApiParameter({
  name: 'id',
  in: 'path',               // 'path' | 'query' | 'header'
  description: 'User ID',
  required: true,
  type: 'string',           // 'string' | 'number' | 'boolean' | 'integer'
  example: '123'
})
```

**@ApiBody** - Document request body:
```typescript
@ApiBody({
  description: 'User data',
  required: true,
  type: CreateUserDto       // DTO class
})
```

### Complete Example

Here's a fully documented controller:

```typescript
@Controller('/api/users')
@ApiTags({ name: 'Users', description: 'User management endpoints' })
export class UserController {

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns a list of all users in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    type: UserResponseDto,
    isArray: true
  })
  getUsers(req: Request, res: Response) {
    return {
      users: [
        { id: '1', username: 'alice', email: 'alice@example.com', age: 25 },
        { id: '2', username: 'bob', email: 'bob@example.com', age: 30 }
      ]
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a single user by their ID'
  })
  @ApiParameter({
    name: 'id',
    in: 'path',
    description: 'User ID',
    required: true,
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  getUser(req: Request, res: Response) {
    const { id } = req.params;
    return {
      id,
      username: 'alice',
      email: 'alice@example.com',
      age: 25
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with the provided information'
  })
  @ApiBody({
    description: 'User data',
    required: true,
    type: CreateUserDto
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input'
  })
  @ValidateBody(CreateUserDto)
  createUser(req: Request, res: Response) {
    res.statusCode = 201;
    return {
      id: '123',
      ...req.body
    };
  }

}
```

### Automatic Tag Collection

Tags are **automatically collected** from your `@ApiTags` decorators - no need to define them in the config:

```typescript
// ✅ Tags are auto-collected from decorators
@Controller('/api/users')
@ApiTags({ name: 'Users', description: 'User management' })
class UserController { }

@Controller('/api/products')
@ApiTags({ name: 'Products', description: 'Product management' })
class ProductController { }

// ❌ No need to define tags in config
const app = new MuzuServer({
  swagger: {
    // tags: [...] // Not needed!
    info: { ... }
  }
});
```

You can use either string format or object format with descriptions:
- String: `@ApiTags('Users', 'Products')`
- Object: `@ApiTags({ name: 'Users', description: '...' })`
- Mixed: `@ApiTags('Auth', { name: 'Users', description: '...' })`

### Accessing Documentation

Once configured, your API documentation is available at:

- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/swagger.json`

**Debug Mode**: Enable `debug: true` in config to see Swagger generation warnings in console.

## HTTP Status Codes

Muzu provides built-in HTTP status code constants:

```typescript
import { Controller, Post, Delete, HttpStatus, Request, Response } from 'muzu';

@Controller('users')
class UserController {

  @Post()
  createUser(req: Request, res: Response) {
    res.statusCode = HttpStatus.CREATED; // 201

    return {
      id: '123',
      username: 'john_doe'
    };
  }

  @Delete(':id')
  deleteUser(req: Request, res: Response) {
    res.statusCode = HttpStatus.NO_CONTENT; // 204
    return {};
  }

}
```

Available constants include: `OK`, `CREATED`, `NO_CONTENT`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`, and more.

## Performance

Muzu is designed from the ground up for maximum performance. Here are some of the optimizations that make Muzu fast:

### Radix Tree Routing

- **O(k) lookup complexity** where k is the number of path segments
- Static routes take precedence over parameterized routes
- Efficient memory usage with shared prefixes

### Build-Time Compilation

**Validators:**
- All validation rules compiled to optimized functions at startup
- Zero runtime overhead for validation logic
- Inline type checks and regex patterns
- No function call overhead

**Middleware:**
- Multiple middleware functions composed into a single function
- Eliminates array iteration at runtime
- Pre-determined async/sync handling

### Runtime Optimizations

- **Fast path parsing** - Pre-compiled parsers for each route
- **Conditional body parsing** - Only parse body for POST/PUT/PATCH
- **Early async detection** - Handler async status determined at build time
- **Direct validation checks** - No validator function calls

## Contributing

We welcome contributions from the community to enhance and improve Muzu. If you're interested in contributing, please visit our GitHub repository: [Muzu GitHub Repo](https://github.com/yldrmzffr/muzu)

## License

Muzu is released under the MIT License. For more information, please refer to the [License File](LICENSE).

If you have any questions or need further assistance, feel free to reach out to us. Happy coding with Muzu!
