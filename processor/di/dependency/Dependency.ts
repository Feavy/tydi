import {Node, Type} from "ts-morph";

export default class Dependency {
    public hasDependent: boolean = false;
    public readonly dependencies: Dependency[] = [];

    constructor(public readonly declaration: Node, public readonly types: Type[], public readonly name?: string) {
    }

    public replace(d1: Dependency, d2: Dependency): void {
        const index = this.dependencies.indexOf(d1);
        if(index < 0) {
            throw new Error(`Dependency not found ${d1}`)
        }
        this.dependencies[index] = d2;
    }

}