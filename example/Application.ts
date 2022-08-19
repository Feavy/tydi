import Provides from "./Provides";
import Singleton from "./Singleton";

@Singleton
export default class Application {

    @Provides
    public baseUrl: string = "CONFLICT";

    @Provides
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }
}