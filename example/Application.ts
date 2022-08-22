import Produces from "./Produces";
import Singleton from "./Singleton";

@Singleton
export default class Application {

    @Produces
    public baseUrl: string = "CONFLICT";

    @Produces
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }
}