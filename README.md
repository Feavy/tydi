# Simple Dependency Injection for TypeScript

[![NPM Version](https://img.shields.io/npm/v/tydi)](https://www.npmjs.com/package/tydi)


Use TypeScript compiler to automatically detect, instantiate and link your dependencies **at compile-time**. It then generates a simple source file for you to import. Nothing magic 🙂

Syntax is inspired from Jakarta Contexts and Dependency Injection specification.

The available annotations are:
- `@Singleton` : Defines a bean (Service) class, it will be automatically instantiated and injected into the beans that depend on it.
- `@Produces` : A Singleton can have properties and methods annotated with @Produces to turn their (return) value into bean and allow them to be injected in other beans. Note that methods called `getAbc` with produces a bean called `abc`.
- `@Inject` : Annotated on singleton's properties to inject their value lazily. It makes cyclic dependencies possible.
- `@Startup` : Singleton's methods annotated with @Startup will be called on start.
- `@Priority` : Set the priority of a method annotated with @Startup.

A global bean called `Dependencies` is available to get beans programmatically, at runtime.

You can either inject it or use it by static access with methods, like: `Dependencies.list()`

Note that if multiple beans match an injection point the app will not compile. There are no concept of default / alternative beans for the moment.

A function `injectDependencies` is also available to inject dependencies into a function which can be useful when working with JSX function components.

```tsx
export const App = injectDependencies((app: Application) =>
  (props: {}) => {
    console.log("props", props)
    console.log("App", app)
    return (
        <>
          <h1>app={`${app}`}</h1>
        </>
    );
  }
);
```

## Installation

First install tydi with your favorite node package manager.

For instance: `npm install tydi --save-dev`

Now you are ready to type `tydi` in order to update dependencies!

If the command is not available you can find it in `./node_module/.bin/tidy` or you can add a script in `package.json` to run it:

```json
{
  "scripts": {
    "tydi": "tydi"
  }
}
```

Then you should be able to run it with `npm run tydi`


## Example

 ```ts
// We define a singleton class to be injectable (bean)
 @Singleton
export default class Application {
    // This singleton produces a number bean called "answer" with value 42
    @Produces
    public answer: number = 42;

    // It also produces a string bean called "baseUrl" with value "http://localhost:3000"
    @Produces
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }

    @Startup // This method will be called on application startup
    @Priority(100) // Optionally set a priority to manage startup methods order
    public startup() {
        console.log("[Application] started!");
        // Get the Map<name, bean> of loaded beans
        console.log("[Application] all dependencies: ", Dependencies.map());
    }
}
 ```

```ts
@Singleton
export default class HttpClient implements IHttpClient {

    // baseUrl is automatically injected in the constructor (as it is defined in Application)
    public constructor(private baseUrl: string) {
    }
    
    public get(url: string): Promise<any> {
        // ...
    }
}
```

```ts
@Singleton
export default class MyService {
    // It is possible to inject beans lazily (this allows cyclic dependency)
    @Inject
    private application: Application;

    // httpClient is injected is the constuctor
    // Note that we rely on the IHttpClient interface and not the direct HttpClient class
    public constructor(private httpClient: IHttpClient) {
    }

    // Startup method
    @Startup
    public startup(): void {
        console.log("[MyService] started!");
    }
}
```

## How does it work?

Tydi uses TypeScript compiler (wrapped in ts-morph) to analyze your source files every time you run it.

Then it creates a `setup_dependencies.ts` file to set all the dependencies up.

It also adds a line at the very top of your `index.ts` file to include it.

This file looks like this:

```ts
// @ts-nocheck

// Imports

// DependencyManager
const dependencies_12 = new Dependencies();

// Dependencies
const application_0 = new Application();
const answer_2 = application_0.answer;
const baseUrl_4 = application_0.getBaseUrl();
const httpClient_6 = new HttpClient(baseUrl_4);
const myService_11 = new MyService(httpClient_6);

// Lazy injects
myService_11["application"] = application_0;
myService_11["baseUrl"] = baseUrl_4;

// Register dependencies in DependencyManager
dependencies_12.register("Application", application_0);
dependencies_12.register("answer", answer_2);
dependencies_12.register("baseUrl", baseUrl_4);
dependencies_12.register("HttpClient", httpClient_6);
dependencies_12.register("MyService", myService_11);
dependencies_12.register("Dependencies", dependencies_12);

// Run @Startup methods
application_0.startup();
myService_11.startup();
```
