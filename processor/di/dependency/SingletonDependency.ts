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
        types.push(...clazz.getType().getBaseTypes());

        const dependencies = clazz.getConstructors().flatMap(c => c.getParameters()).map(p => new Dependency(p, [p.getType()], p.getName()));

        const dependency = new SingletonDependency(clazz, types, name, `import ... from ...;`);
        dependency.dependencies.push(...dependencies);

        return dependency;
    }
}

// function findExportFor(clazz: ClassDeclaration): string {
//     const exportedDeclarations = clazz.getSourceFile().getExportedDeclarations();
//     for (const [name, declarations] of exportedDeclarations) {
//         for (const declaration of declarations) {
//             if(clazz === declaration) {
//                 return name
//             }
//         }
//     }
//     return null
// }
