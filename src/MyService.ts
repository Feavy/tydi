import Singleton from "../processor/di/annotations/Singleton";
import Inject from "../processor/di/annotations/Inject";
import Startup from "../processor/di/annotations/Startup";
import type IHttpClient from "./IHttpClient";
import Application from "./Application";

@Singleton
export default class MyService {
    private httpClient: IHttpClient;

    @Inject
    private application: Application;

    @Inject
    private baseUrl: string;

    public constructor(private a: number, httpClient: IHttpClient) {
        this.httpClient = httpClient;
    }

    @Startup
    public startup(): void {
        console.log("[MyService] started!");
        console.log("[MyService] baseUrl:", this.baseUrl)
        console.log("[MyService] a:", this.a)
        console.log("[MyService] application:", this.application);
        this.httpClient.get("/test");
    }
}