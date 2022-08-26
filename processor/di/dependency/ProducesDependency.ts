import Dependency from "./Dependency";
import {ClassDeclaration, MethodDeclaration, Node, PropertyDeclaration, Type} from "ts-morph";
import SingletonDependency from "./SingletonDependency";

export default class ProducesDependency extends Dependency {
    public constructor(declaration: Node,
                       types: Type[],
                       name: string,
                       producer: SingletonDependency,
    ) {
        super(declaration, types, name);
        this.dependencies.push(producer)
    }

    public get producer() {
        return this.dependencies[0] as SingletonDependency
    }

    public static fromMethodDeclaration(clazz: ClassDeclaration, method: MethodDeclaration) {
        let name = method.getName();
        if (name.startsWith("get")) {
            name = name.substring(3);
            name = name[0].toLowerCase() + name.substring(1);
        }
        const types = [method.getReturnType()];
        types.push(...method.getReturnType().getBaseTypes());
        return new ProducesDependency(method, types, name, SingletonDependency.fromClassDeclaration(clazz))
    }

    public static fromPropertyDeclaration(clazz: ClassDeclaration, property: PropertyDeclaration) {
        let name = property.getName();
        const types = [property.getType()];
        types.push(...property.getType().getBaseTypes());
        return new ProducesDependency(property, types, name, SingletonDependency.fromClassDeclaration(clazz))
    }
}