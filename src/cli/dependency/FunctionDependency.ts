import Dependency from "./Dependency";
import { CallExpression, Expression, FunctionExpression, Identifier, Type, VariableDeclaration} from "ts-morph";
import injectDependencies from "../../lib/runtime/injectDependencies";
import ExportedDeclaration from "../types/ExportedVariableDeclaration";

export default class FunctionDependency extends Dependency {
    public constructor(exportedDeclaration: ExportedDeclaration, types: (Type|string)[], name: string) {
        super(exportedDeclaration.declaration.getText(), types, name);
        this.importStatement = generateImportStatement(this.variableName, exportedDeclaration);
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
            if(dependency.found) {
                outArgs.push(dependency.variableName);
            } else {
                inArgs.push(dependency.variableName+": any");
                outArgs.push(dependency.variableName);
            }

            if(dependency.instantiated) continue;

            code += dependency.generateInstantiationCode()
        }

        code += `${this.variableName}.body = ${this.variableName}(${outArgs.join(", ")});\n`;

        return code;
    }

    public static fromExportedVariable(_export: ExportedDeclaration, original: Function): FunctionDependency {
        const parameters = original.body.getParameters();

        const dependencies = parameters.map(p => new Dependency(p.getText(), [p.getType()], p.getName()));
        for(const dependency of dependencies) {
            dependency.ignoreIfNotFound = true;
        }

        const functionDependency = new FunctionDependency(_export, [], original.name);
        functionDependency.dependencies.push(...dependencies);

        return functionDependency;
    }

    public static findExportedInjectDependenciesCallExpression(_export: ExportedDeclaration): Function {
        const declaration = _export.declaration;

        const expression = declaration instanceof Expression ? declaration : (declaration instanceof VariableDeclaration ? declaration.getInitializer() : undefined);
        
        if(expression instanceof CallExpression) {
            const call = expression;
            if (call.getExpression() instanceof Identifier && call.getExpression().getText() == injectDependencies.name) {
                const body = call.getArguments()[0] as FunctionExpression;
                return {
                    name: _export.name,
                    body
                }
            }
        }
        return null;
    }
}

function generateImportStatement(variableName: string, _export: ExportedDeclaration): string {
    // const call = _export.getExpression() as CallExpression;

    // const original = call.getArguments()[0] as Identifier;
    // const className = original.getText();

    const regex = /(.*)\.tsx?$/; // /.*((src|processor)\/[^.]+)\.ts$/;
    const sourcePath = regex.exec(_export.declaration.getSourceFile().getFilePath())[1].replace(/.*\/node_modules\//, "");

    if(_export.name === "default") {
        return `import ${variableName} from "${sourcePath}";`;
    } else {
        return `import {${_export.name} as ${variableName}} from "${sourcePath}";`;
    }
}

export interface Function {
    name: string;
    body: FunctionExpression;
}