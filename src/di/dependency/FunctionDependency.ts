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

        code += `const ${this.variableName}_old = ${this.variableName}.body;\n`;
        code += `${this.variableName}.body = (${inArgs.join(", ")}) => ${this.variableName}_old(${outArgs.join(", ")});\n`;

        /*

        const App = (props: { }, app?: Application) => { ... }

        Le but est d'injecter les dépendances

        App.body = (props: { }) => App(props, // Application dependency // );

         */

        // if(!this.producer.instantiated) {
        //     code += this.producer.generateInstantiationCode();
        // }
        // code += `const ${this.variableName} = ${this.producer.variableName}.${this.member + (this.isMethod ? "()" : "")};\n`;
        // this.instantiated = true;
        // return code;
        return code;
    }

    public static fromExport(_export: ExportAssignment): FunctionDependency {
        const call = _export.getExpression() as CallExpression;

        const original = call.getArguments()[0] as Identifier;
        const functionName = original.getText();

        const definition = original.getDefinitionNodes()[0] as VariableDeclaration;

        const initializer = definition.getInitializer() as ArrowFunction;

        const parameters = initializer.getParameters();

        // const parameterTypes = parameters.map(p => p.getType());

        const dependencies = parameters.map(p => new Dependency(p, [p.getType()], p.getName()));
        for(const dependency of dependencies) {
            dependency.ignoreIfNotFound = true;
        }

        const functionDependency = new FunctionDependency(_export, [], functionName);
        functionDependency.dependencies.push(...dependencies);

        return functionDependency;
    }

    public static isFunctionDependencyExport(_export: ExportAssignment) {
        if(_export.getExpression() instanceof CallExpression) {
            const call = _export.getExpression() as CallExpression;
            if (call.getExpression() instanceof Identifier && call.getExpression().getText() == injectDependencies.name) {
                return true;
            }
        }
        return false;
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