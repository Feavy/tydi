import Dependency from "./Dependency";
import {ClassDeclaration, MethodDeclaration, Node, PropertyDeclaration, Type} from "ts-morph";
import SingletonDependency from "./SingletonDependency";

export default class ProducesDependency extends Dependency {
    public constructor(declaration: Node,
                       types: (Type|string)[],
                       name: string,
                       producer: SingletonDependency,
                       private readonly isMethod: boolean,
                       private readonly member: string
    ) {
        super(declaration.getText(), types, name);
        this.dependencies.push(producer);
    }

    public replace(d1: Dependency, d2: Dependency) {
        super.replace(d1, d2);
        d2.hasDependent = true;
    }

    public get producer() {
        return this.dependencies[0] as SingletonDependency
    }

    public static fromDeclaration(clazz: ClassDeclaration, product: MethodDeclaration|PropertyDeclaration) {
        if(product instanceof MethodDeclaration) {
            return ProducesDependency.fromMethodDeclaration(clazz, product);
        }else { //if(product instanceof PropertyDeclaration) {
            return ProducesDependency.fromPropertyDeclaration(clazz, product);
        }
    }

    public static fromMethodDeclaration(clazz: ClassDeclaration, method: MethodDeclaration) {
        let name = method.getName();
        if (name.startsWith("get")) {
            name = name.substring(3);
            name = name[0].toLowerCase() + name.substring(1);
        }
        const types = [method.getReturnType()];
        types.push(...method.getReturnType().getBaseTypes());
        return new ProducesDependency(method, types, name, SingletonDependency.fromClassDeclaration(clazz), true, method.getName())
    }

    public static fromPropertyDeclaration(clazz: ClassDeclaration, property: PropertyDeclaration) {
        let name = property.getName();
        const types = [property.getType()];
        types.push(...property.getType().getBaseTypes());
        return new ProducesDependency(property, types, name, SingletonDependency.fromClassDeclaration(clazz), false, property.getName())
    }

    public generateInstantiationCode(): string {
        let code: string = "";
        if(!this.producer.instantiated) {
            code += this.producer.generateInstantiationCode();
        }
        code += `const ${this.variableName} = ${this.producer.variableName}.${this.member + (this.isMethod ? "()" : "")};\n`;
        this.instantiated = true;
        return code;
    }
}