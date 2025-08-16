import {
    ClassDeclaration, ExportedDeclarations,
    MethodDeclaration, Project,
    PropertyDeclaration,
    SourceFile,
} from "ts-morph";
import Singleton from "../lib/annotations/Singleton";
import SingletonDependency from "./dependency/SingletonDependency";
import Produces from "../lib/annotations/Produces";
import ProducesDependency from "./dependency/ProducesDependency";
import DependencyGraph from "./DependencyGraph";
import FunctionDependency, { Function } from "./dependency/FunctionDependency";
import ExportedDeclaration from "./types/ExportedVariableDeclaration";

export default function generateCode(project: Project) {
    const graph = new DependencyGraph();
    // 1 - Collect dependencies and their dependencies (@Singleton, @Produces) & Populate data structure.
    const singletonsClasses = getSingletons();
    graph.addDependency(new SingletonDependency("built-in dependency bean", ["Dependencies"], "Dependencies", "import { Dependencies } from \"tydi\"; "))
    for (const singleton of singletonsClasses) {
        graph.addDependency(SingletonDependency.fromClassDeclaration(singleton))
        const products = getProducts(singleton)
        for (const product of products) {
            graph.addDependency(ProducesDependency.fromDeclaration(singleton, product));
        }
    }

    const functions = getInjectDependenciesFunction();

    for (const func of functions) {
        graph.addDependency(func);
    }

    // 2 - Link dependency graph.
    graph.linkGraph()


    // 3 - Generate code.
    let code: string = "// @ts-nocheck\n";

    // Generate imports
    code += "// Imports\n";
    const dependencies = graph.dependencies;
    for (const dependency of dependencies) {
        if(dependency.importStatement) {
            code += dependency.importStatement.replace(project.getDirectory("src").getPath(), ".")+"\n";
        }
    }

    code += "\n";

    // Create DependencyManager
    let dependencyManager = graph.getDependencyByName("Dependencies");
    if(dependencyManager) {
        code += "// DependencyManager\n";
        code += dependencyManager.generateInstantiationCode()
        code += "\n";
    }

    // Generate dependencies
    code += "// Dependencies\n";
    const entrypoints = graph.entrypoints;
    for (const entrypoint of entrypoints) {
        if(entrypoint.instantiated) continue; // DependencyManager
        code += entrypoint.generateInstantiationCode()
    }

    code += "\n";

    // Populate @Inject properties
    code += "// Lazy injects\n";
    const singletons = graph.singletons;
    for (const singleton of singletons) {
        code += singleton.generatePopulateInjectsCode()
    }

    code += "\n";

    // Register dependencies in DependencyManager
    code += "// Register dependencies in DependencyManager\n";
    for (const dependency of graph.dependencies) {
        code += `${dependencyManager.variableName}.register("${dependency.name}", ${dependency.variableName});\n`
    }

    code += "\n";

    // Run startup methods
    code += "// Run @Startup methods\n";
    code += generateStartupCode(singletons);

    // Call setup methods if needed

    return code;

    function getSingletons(): ClassDeclaration[] {
        const files = project.getSourceFiles();
        const classes = getClasses(files);
        return classes.filter(c => c.getDecorators().some(d => d.getName() == Singleton.name));
    }

    function getProducts(singleton: ClassDeclaration): (MethodDeclaration|PropertyDeclaration)[] {
        const properties = singleton.getProperties().filter(p => p.getDecorators().some(d => d.getName() == Produces.name))
        const methods = singleton.getMethods().filter(m => m.getDecorators().some(d => d.getName() == Produces.name))
        return [...properties, ...methods]
    }

    function getClasses(files: SourceFile[]) {
        const classes: ClassDeclaration[] = [];
        for(const file of files) {
            const fileClasses = file.getClasses();
            classes.push(...fileClasses);
        }
        return classes;
    }

    function getInjectDependenciesFunction() {
        const files = project.getSourceFiles();
        const variables = getExportedVariables(files);
        return variables
            .map(exp => [exp, tryOrNull(() => FunctionDependency.findExportedInjectDependenciesCallExpression(exp))] as [ExportedDeclaration, Function | null])
            .filter(([_, func]) => func != null)
            .map(([exp, func]) => FunctionDependency.fromExportedVariable(exp, func));
    }

    function getExportedVariables(files: SourceFile[]): ExportedDeclaration[] {
        const variables: ExportedDeclaration[] = [];

        for(const file of files) {
            const declarations = [...file.getExportedDeclarations()]
                .map(([name, declarations]) => [name, declarations[0]] as [string, ExportedDeclarations])
                .map(d => ({
                    name: d[0],
                    declaration: d[1] as ExportedDeclarations
                } as ExportedDeclaration));

            variables.push(...declarations);
        }
        return variables;
    }

    function generateStartupCode(singletons: SingletonDependency[]) {
        const startupMethods = singletons.flatMap(s => s.startupMethods).sort((a, b) => b.priority - a.priority);

        let code = "";
        for(const { variableName, methodName } of startupMethods) {
            code += `${variableName}.${methodName}();\n`;
        }
        return code;
    }

    function tryOrNull<T>(func: () => T): T | null {
        try {
            return func();
        } catch (e) {
            return null;
        }
    }
}