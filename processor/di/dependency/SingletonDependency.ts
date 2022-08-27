import Dependency from "./Dependency";
import {ClassDeclaration, Node, Type} from "ts-morph";
import Inject from "../annotations/Inject";

export default class SingletonDependency extends Dependency {
    private constructorDependencies: Dependency[] = [];
    private injectedDependencies: Dependency[] = [];
    private injectedDependenciesProperties: Map<Dependency, string> = new Map();

    public constructor(declaration: Node,
                       types: Type[],
                       name: string,
                       public readonly importStatement: string
    ) {
        super(declaration, types, name);
    }

    public replace(d1: Dependency, d2: Dependency) {
        super.replace(d1, d2);
        const index = this.constructorDependencies.indexOf(d1);
        if(index >= 0) {
            this.constructorDependencies[index] = d2;
        }
        const index2 = this.injectedDependencies.indexOf(d1);
        if(index2 >= 0) {
            this.injectedDependencies[index2] = d2;
            this.injectedDependenciesProperties.set(d2, this.injectedDependenciesProperties.get(d1))
        }
    }

    public static fromClassDeclaration(clazz: ClassDeclaration) {
        const name = clazz.getName();
        const types = [clazz.getType()];
        types.push(...clazz.getBaseTypes());
        types.push(...clazz.getImplements().map(i => i.getType()))

        const constructorDependencies = clazz.getConstructors().flatMap(c => c.getParameters()).map(p => new Dependency(p, [p.getType()], p.getName()));
        const injectedDependencies = clazz.getProperties().filter(p => p.getDecorators().some(d => d.getName() === Inject.name)).map(p => new Dependency(p, [p.getType()], p.getName()));

        const singleton = new SingletonDependency(clazz, types, name, generateImportStatement(clazz));
        singleton.dependencies.push(...constructorDependencies);
        singleton.dependencies.push(...injectedDependencies);
        singleton.injectedDependencies.push(...injectedDependencies);
        singleton.constructorDependencies.push(...constructorDependencies);
        singleton.injectedDependenciesProperties = new Map(injectedDependencies.map(d => [d, d.name]))

        return singleton;
    }

    public generateInstantiationCode(): string {
        let code: string = "";
        for (const dependency of this.dependencies) {
            if(dependency.instantiated) continue;

            code += dependency.generateInstantiationCode()
        }
        code += `const ${this.variableName} = new ${this.name}(${this.constructorDependencies.map(d => d.variableName).join(", ")});\n`;
        this.instantiated = true;
        return code;
    }

    public generatePopulateInjectsCode() {
        let code: string = "";
        for (const dependency of this.injectedDependencies) {
            const propertyName = this.injectedDependenciesProperties.get(dependency);
            code += `${this.variableName}["${propertyName}"] = ${dependency.variableName};\n`;
        }
        return code;
    }
}

function generateImportStatement(clazz: ClassDeclaration): string {
    const className = clazz.getName();
    const regex = /(.*)\.ts$/; // /.*((src|processor)\/[^.]+)\.ts$/;
    const sourcePath = regex.exec(clazz.getSourceFile().getFilePath())[1];

    const exportedDeclarations = clazz.getSourceFile().getExportedDeclarations();
    for (const [name, declarations] of exportedDeclarations) {
        for (const declaration of declarations) {
            if(clazz === declaration) {
                if(name === 'default') {
                    return `import ${className} from "${sourcePath}";`;
                }else {
                    return `import {${className}} from "${sourcePath}";`;
                }
            }
        }
    }
    return `Could not create import statement for ${sourcePath}`;
}
