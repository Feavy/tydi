import SingletonAnnotation from "../processor/singleton/SingletonAnnotation";

@SingletonAnnotation
export default class MyService {
    public constructor(private a: number) {
        console.log(this.a);
    }
    
    public doSomething(): void {
        console.log("started");
    }
}