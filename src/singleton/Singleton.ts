import { ClassDeclaration } from "ts-morph";
import SingletonDependency from "./SingletonDependency";

export default class Singleton {
    public constructor(public readonly clazz: ClassDeclaration, public readonly dependencies: SingletonDependency[]) {
    }

    public debug(): void {
        if (this.dependencies.length > 0) {
            console.log(this.clazz.getName() + " requires " + this.dependencies.map(d => d.name + ":" + d.type).join(", "));
        } else {
            console.log(this.clazz.getName() + " has no dependency");
        }
    }
}