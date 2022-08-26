import Singleton from "../processor/di/annotations/Singleton";
import HttpClient from "./HttpClient";

@Singleton
export default class MyService {
    public constructor(private a: number, private httpClient: HttpClient) {
        console.log(this.a);
    }
    
    public doSomething(): void {
        this.httpClient.get("/test");
        console.log("started");
    }
}