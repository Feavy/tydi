import Dependency from "./Dependency";
import {ArrowFunction, CallExpression, ExportAssignment, Identifier, Type, VariableDeclaration} from "ts-morph";
import injectDependencies from "../runtime/injectDependencies";

export default class FunctionDependency extends Dependency {
    public constructor(declaration: ExportAssignment, types: (Type|string)[], name: string) {
        super(declaration, types, name);
        this.importStatement = generateImportStatement(this.variableName, declaration);
    }

    public replace(d1: Dependency, d2: Dependency) {
        super.replace(d1, d2);
        d2.hasDependent = true;
    }

    public generateInstantiationCode(): string {
        let code: string = "";

        const inArgs: string[] = [];
        const outArgs: string[] = [];

        for (const dependency of this.dependencies) {
            if(dependency.instantiated) continue;

            code += dependency.generateInstantiationCode()

            if(dependency.found) {
                outArgs.push(dependency.variableName);
            } else {
                inArgs.push(dependency.variableName+": any");
                outArgs.push(dependency.variableName);
            }
        }

        code += `${this.variableName}.body = ${this.variableName}(${outArgs.join(", ")});\n`;

        return code;
    }

    public static fromExportedFunction(_export: ExportAssignment, original: Function): FunctionDependency {
        const parameters = original.body.getParameters();

        const dependencies = parameters.map(p => new Dependency(p, [p.getType()], p.getName()));
        for(const dependency of dependencies) {
            dependency.ignoreIfNotFound = true;
        }

        const functionDependency = new FunctionDependency(_export, [], original.name);
        functionDependency.dependencies.push(...dependencies);

        return functionDependency;
    }

    public static findExportedInjectDependenciesCallExpression(_export: ExportAssignment): Function {
        if(_export.getExpression() instanceof CallExpression) {
            const call = _export.getExpression() as CallExpression;
            if (call.getExpression() instanceof Identifier && call.getExpression().getText() == injectDependencies.name) {
                const original = call.getArguments()[0] as Identifier;
                const functionName = original.getText();

                const definition = original.getDefinitionNodes()[0] as VariableDeclaration;

                return {
                    name: functionName,
                    body: definition.getInitializer() as ArrowFunction
                }
            }
        }else if(_export.getExpression() instanceof Identifier) {
            const identifier = _export.getExpression() as Identifier;
            const functionName = identifier.getText();
            const definition = identifier.getDefinitionNodes()[0] as VariableDeclaration;
            const call = definition.getInitializer() as CallExpression;

            if (call.getExpression() instanceof Identifier && call.getExpression().getText() == injectDependencies.name) {
                const original = call.getArguments()[0] as ArrowFunction;

                return {
                    name: functionName,
                    body: original
                }
            }
        }
        return null;
    }
}

function generateImportStatement(variableName: string, _export: ExportAssignment): string {
    // const call = _export.getExpression() as CallExpression;

    // const original = call.getArguments()[0] as Identifier;
    // const className = original.getText();

    const regex = /(.*)\.tsx?$/; // /.*((src|processor)\/[^.]+)\.ts$/;
    const sourcePath = regex.exec(_export.getSourceFile().getFilePath())[1].replace(/.*\/node_modules\//, "");

    return `import ${variableName} from "${sourcePath}";`;
}

export interface Function {
    name: string;
    body: ArrowFunction;
}