import Dependency from "./Dependency";
import {ClassDeclaration, Node, Type} from "ts-morph";

export default class SingletonDependency extends Dependency {
    public constructor(declaration: Node,
                       types: Type[],
                       name: string,
                       public readonly importStatement: string
    ) {
        super(declaration, types, name);
    }

    public static fromClassDeclaration(clazz: ClassDeclaration) {
        const name = clazz.getName();
        const types = [clazz.getType()];
        types.push(...clazz.getBaseTypes());
        types.push(...clazz.getImplements().map(i => i.getType()))

        const dependencies = clazz.getConstructors().flatMap(c => c.getParameters()).map(p => new Dependency(p, [p.getType()], p.getName()));

        const dependency = new SingletonDependency(clazz, types, name, generateImportStatement(clazz));
        dependency.dependencies.push(...dependencies);

        return dependency;
    }

    public generateInstantiationCode(): string {
        let code: string = "";
        for (const dependency of this.dependencies) {
            if(dependency.instantiated) continue;

            code += dependency.generateInstantiationCode()
        }
        code += `const ${this.variableName} = new ${this.name}(${this.dependencies.map(d => d.variableName).join(", ")});\n`;
        this.instantiated = true;
        return code;
    }
}

function generateImportStatement(clazz: ClassDeclaration): string {
    const className = clazz.getName();
    const regex = /.*src\/([^.]+)\.ts$/;
    const sourcePath = "./"+regex.exec(clazz.getSourceFile().getFilePath())[1];

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
