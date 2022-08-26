import Singleton from "../processor/di/annotations/Singleton";
import type IHttpClient from "./IHttpClient";

@Singleton
export default class MyService {
    private httpClient: IHttpClient;

    public constructor(private a: number, httpClient: IHttpClient) {
        this.httpClient = httpClient;
        console.log(this.a);
    }
    
    public doSomething(): void {
        this.httpClient.get("/test");
        console.log("started");
    }
}