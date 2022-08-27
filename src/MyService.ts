import Singleton from "../processor/di/annotations/Singleton";
import type IHttpClient from "./IHttpClient";
import Application from "./Application";
import Inject from "../processor/di/annotations/Inject";

@Singleton
export default class MyService {
    private httpClient: IHttpClient;

    @Inject
    private application: Application;

    public constructor(private a: number, httpClient: IHttpClient) {
        this.httpClient = httpClient;
        console.log(this.a);
    }

    public doSomething(): void {
        this.httpClient.get("/test");
        console.log("started");
        console.log("application: ", this.application);
    }
}