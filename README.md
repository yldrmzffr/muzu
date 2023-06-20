# Muzu

"Muzu" is a TypeScript npm library that provides functionality for handling and routing HTTP requests on the server side.

## Installation

To add the library to your project, you can use the following command:

```shell
npm install muzu
```

## Usage

Here's an example usage:

```typescript
import { MuzuServer, Request, Response } from 'muzu';

const app = new MuzuServer();
const { Get, Controller } = app;

@Controller('auth')
class TestController {

  @Get('login')
  login(req: Request, res: Response) {
    // Do something here

    return {
      status: true
    };
  }

}

app.listen(8080);
```

In the above example, an instance of the `MuzuServer` class is created and a route is defined using the `@Get` and `@Controller` decorators. The `TestController` class is annotated with the `@Controller('auth')` decorator to specify the base route path. The `login` method within the `TestController` class is annotated with the `@Get('login')` decorator to define the route for handling GET requests to the '/login' endpoint. (http://localhost:8080/auth/login)

Inside the `login` method, you can add your desired logic to handle the request. In this example, a simple object `{ status: true }` is returned as the response.

The server listens on port 8080 using the `listen` method of the `MuzuServer` instance.

## Contributing

If you would like to contribute, please check the GitHub repository: [Muzu GitHub Repo](https://github.com/yldrmzffr/muzu)

## License

This project is licensed under the MIT License. See the [License File](LICENSE) for more information.

