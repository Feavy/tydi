import Produces from "../processor/singleton/Produces";
import Singleton from "../processor/singleton/Singleton";

@Singleton
export default class Application {

    @Produces
    public baseUrl: string = "CONFLICT";

    @Produces
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }
}