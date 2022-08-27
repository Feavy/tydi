import Produces from "../processor/di/annotations/Produces";
import Singleton from "../processor/di/annotations/Singleton";
import Startup from "../processor/di/annotations/Startup";

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

    @Startup
    public startup() {
        console.log("[Application] started!");
    }
}