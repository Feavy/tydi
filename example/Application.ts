import Singleton from "./Singleton";

@Singleton
export default class Application {
    @Provides
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }
}