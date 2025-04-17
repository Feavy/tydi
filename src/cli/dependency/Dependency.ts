import { Type } from "ts-morph";

export default class Dependency {
    private static counter: number = 0;
    public hasDependent: boolean = false;
    public readonly dependencies: Dependency[] = [];
    public instantiated: boolean = false;
    public readonly variableName: string;
    public readonly types: string[];
    public ignoreIfNotFound: boolean = false;
    public found: boolean = false;

    constructor(public readonly declaration: string, types: (Type|string)[], public readonly name: string, public importStatement?: string) {
        this.variableName = Dependency.generateVariableName(name);
        this.types = types.map(type => {
            if(typeof type === "string") return type;
            return type.getText()
        });
    }

    public replace(d1: Dependency, d2: Dependency): void {
        const index = this.dependencies.indexOf(d1);
        if(index < 0) {
            throw new Error(`Dependency not found ${d1}`)
        }
        this.dependencies[index] = d2;
    }

    public generateInstantiationCode(): string {
        return "";
    }

    private static generateVariableName(name: string) {
        return name[0].toLowerCase() + name.substring(1) + "_" + this.counter++;
    }
}