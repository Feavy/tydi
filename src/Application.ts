import Produces from "../processor/di/annotations/Produces";
import Singleton from "../processor/di/annotations/Singleton";

@Singleton
export default class Application {

    // @Produces
    // public baseUrl: string = "CONFLICT";

    @Produces
    public a: number = 8;

    @Produces
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }
}