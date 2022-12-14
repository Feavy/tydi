import {ClassDeclaration, MethodDeclaration, Project, PropertyDeclaration, SourceFile} from "ts-morph";
import Singleton from "./annotations/Singleton";
import SingletonDependency from "./dependency/SingletonDependency";
import Produces from "./annotations/Produces";
import ProducesDependency from "./dependency/ProducesDependency";
import DependencyGraph from "./DependencyGraph";

export default function generateCode(project: Project) {
    const graph = new DependencyGraph();
    // 1 - Collect dependencies and their dependencies (@Singleton, @Produces) & Populate data structure.
    const singletonsClasses = getSingletons();
    for (const singleton of singletonsClasses) {
        graph.addDependency(SingletonDependency.fromClassDeclaration(singleton))
        const products = getProducts(singleton)
        for (const product of products) {
            graph.addDependency(ProducesDependency.fromDeclaration(singleton, product));
        }
    }

    // 2 - Link dependency graph.
    graph.linkGraph()


    // 3 - Generate code.
    let code: string = "// @ts-nocheck\n";

    // Generate imports
    code += "// Imports\n";
    const singletons = graph.singletons;
    for (const singleton of singletons) {
        code += singleton.importStatement+"\n";
    }

    code += "\n";

    // Create DependencyManager
    code += "// DependencyManager\n";
    let dependencyManager = graph.getDependencyByName("Dependencies");
    code += dependencyManager.generateInstantiationCode()
    code += "\n";

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
    for (const singleton of singletons) {
        code += singleton.generateStartupCode()
    }

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
}