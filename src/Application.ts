import ProducesAnnotation from "../processor/singleton/ProducesAnnotation";
import SingletonAnnotation from "../processor/singleton/SingletonAnnotation";

@SingletonAnnotation
export default class Application {

    @ProducesAnnotation
    public baseUrl: string = "CONFLICT";

    @ProducesAnnotation
    public getBaseUrl(): string {
        return "http://localhost:3000";
    }
}