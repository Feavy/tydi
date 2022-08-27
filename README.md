# Dependency Injection for TypeScript

Use TypeScript transformers to auto detect, link and instantiate dependencies **at compile-time**.

Syntax is inspired from Java's bean definition.

The available annotations are:
- `@Singleton` : Defines a bean class, it will be automatically instantiated and injected into the beans that depend on it.
- `@Produces` : A Singleton can have properties and methods annotated with @Produces to turn their (return) value into bean and allow them to be injected in other beans. Note that methods called `getAbc` with produces a bean called `abc`.
- `@Inject` : Annotated on singleton's properties to inject their value lazily. It makes cyclic dependencies possible.
- `@Startup` : Singleton's methods annotated with @Startup will be called on start.

A global bean called `Dependencies` is available to get beans programmatically, at runtime.

You can either inject it or use it by static access with methods, like: `Dependencies.list()`

Note that if multiple beans match an injection point the app will not compile. There are no concept of default / alternative beans for the moment.

## Example

 ```ts
// We define a singleton class (also known as a service)
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

    // This method will be called on start
    @Startup
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

    // Startp method
    @Startup
    public startup(): void {
        console.log("[MyService] started!");
    }
}
```