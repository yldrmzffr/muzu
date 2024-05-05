# Muzu: TypeScript HTTP Request Handling and Routing Library

**Muzu** is a powerful TypeScript npm library designed for server-side HTTP request handling and routing. It provides developers with a seamless and efficient way to handle and route HTTP requests in their Node.js applications.

## Installation

To incorporate Muzu into your project, you can easily install it via npm using the following command:

```shell
npm install muzu
```

## Usage

Here is an in-depth example demonstrating how to leverage the capabilities of Muzu in your application:

```typescript
import { MuzuServer, Request, Response } from 'muzu';

// Create a new instance of the MuzuServer
const app = new MuzuServer();
const { Post, Controller } = app;

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

// Start the server and listen on port 8080
app.listen(8080);
```

In this example, we instantiate a new `MuzuServer` and utilize the `@Post` and `@Controller` decorators to define a route for handling POST requests at the '/login' endpoint within the 'auth' base route.

You can also handle other HTTP methods by using decorators such as `@Get`, `@Put`, `@Delete`, and `@Patch` accordingly.

Inside the `login` method, you can implement the necessary logic to handle the incoming request. In this case, we return a simple object `{ status: true }` as the response.

The server is started and set to listen on port 8080 using the `listen` method of the `MuzuServer` instance.

## Middleware

Muzu supports middleware functions that can be applied to routes to execute specific logic before the route handler. Middleware functions can be used for tasks such as logging, authentication, and data validation.
`@Middleware` decorator can be used to apply middleware functions to specific routes. Let's see an example:

```typescript
import {MuzuServer, Request, Response} from 'muzu';
import {HttpException} from "./http.exception";

// Create a new instance of the MuzuServer
const app = new MuzuServer();
const {Post, Controller, Middleware} = app;

// Create a Middleware Function
function LoggerMiddleware(req: Request) {
  console.log(`Request Received: ${req.url}`);
}

// Create a Middleware Function
function AuthMiddleware(req: Request) {
  const {token} = req.headers;

  if (!token) {
    throw new HttpException('Unauthorized', 401);
  }
  
  const user = getUserFromToken(token);
  
  // You can attact the custom data to the request object
  req.user = user;
}

@Controller('auth')
class TestController {

  @Post('login')
  @Middleware(AuthMiddleware, LoggerMiddleware) // Apply Middleware to the 'login' route
  login(req: Request, res: Response) {
    const {user} = req; // Access the objects attached by the middleware

    // Implement your login logic here

    return {
      status: true
    };
  }

}

// Start the server and listen on port 8080
app.listen(8080);
```

## Exception Handling

Muzu provides a comprehensive exception handling mechanism. You can create custom exception classes by extending the `HttpException` class and utilize them within your application. Let's see an example:

```typescript
import { MuzuServer, Request, Response, HttpException } from 'muzu';

// Custom Exception Class
class UserNotFoundException extends HttpException {
  constructor(details?: string) {
    super('User Not Found!', 404, details);
  }
}

const app = new MuzuServer();
const { Post, Controller } = app;

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

## Contributing

We welcome contributions from the community to enhance and improve Muzu. If you're interested in contributing, please visit our GitHub repository: [Muzu GitHub Repo](https://github.com/yldrmzffr/muzu)

## License

Muzu is released under the MIT License. For more information, please refer to the [License File](LICENSE).

If you have any questions or need further assistance, feel free to reach out to us. Happy coding with Muzu!
