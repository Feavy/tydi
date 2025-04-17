import Dependency from "./Dependency";
import {ClassDeclaration, NumericLiteral, Type} from "ts-morph";
import Inject from "../../lib/annotations/Inject";
import Startup from "../../lib/annotations/Startup";
import Priority from "../../lib/annotations/Priority";

interface StartupMethod {
    priority: number;
    methodName: string;
    variableName: string;
}

export default class SingletonDependency extends Dependency {
    public readonly constructorDependencies: Dependency[] = [];
    private injectedDependencies: Dependency[] = [];
    private injectedDependenciesProperties: Map<Dependency, string> = new Map();

    public readonly startupMethods: StartupMethod[] = [];

    public constructor(declaration: string,
                       types: (Type|string)[],
                       name: string,
                       importStatement: string
    ) {
        super(declaration, types, name, importStatement);
    }

    public replace(d1: Dependency, d2: Dependency) {
        super.replace(d1, d2);
        const index = this.constructorDependencies.indexOf(d1);
        if(index >= 0) {
            this.constructorDependencies[index] = d2;
            d2.hasDependent = true;
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

        const constructorDependencies = clazz.getConstructors().flatMap(c => c.getParameters()).map(p => new Dependency(p.getText(), [p.getType()], p.getName()));
        const injectedDependencies = clazz.getProperties().filter(p => p.getDecorators().some(d => d.getName() === Inject.name)).map(p => new Dependency(p.getText(), [p.getType()], p.getName()));

        const startupMethods = clazz.getMethods().filter(m => m.getDecorators().some(d => d.getName() === Startup.name));
        for (const startupMethod of startupMethods) {
            if(startupMethod.getParameters().length !== 0) {
                throw new Error("A startup method cannot take parameters. That is not the case of:\n    "+startupMethod.getText())
            }
        }

        const singleton = new SingletonDependency(clazz.getText(), types, name, generateImportStatement(clazz));
        singleton.dependencies.push(...constructorDependencies);
        singleton.dependencies.push(...injectedDependencies);
        singleton.injectedDependencies.push(...injectedDependencies);
        singleton.constructorDependencies.push(...constructorDependencies);
        singleton.injectedDependenciesProperties = new Map(injectedDependencies.map(d => [d, d.name]))

        singleton.startupMethods.push(...startupMethods.map(m => ({
            methodName: m.getName(),
            variableName: singleton.variableName,
            priority: (m.getDecorators().find(d => d.getName() === Priority.name)?.getArguments()[0] as NumericLiteral)?.getLiteralValue() ?? 0 
        })));

        return singleton;
    }

    public generateInstantiationCode(): string {
        let code: string = "";
        for (const dependency of this.constructorDependencies) {
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

    public generateStartupCode() {
        let code: string = "";
        for (const method of this.startupMethods) {
            code += `${this.variableName}.${method}();\n`;
        }
        return code;
    }
}

function generateImportStatement(clazz: ClassDeclaration): string {
    const className = clazz.getName();
    const regex = /(.*)\.tsx?$/; // /.*((src|processor)\/[^.]+)\.ts$/;
    const sourcePath = regex.exec(clazz.getSourceFile().getFilePath())[1].replace(/.*\/node_modules\//, "");

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
