import Singleton from "./Singleton";

@Singleton
export default class MyService {
    public constructor(private a: number) {
        console.log(this.a);
    }
    
    public doSomething(): void {
        console.log("started");
    }
}