import {ClassDeclaration, MethodDeclaration, Project, PropertyDeclaration, SourceFile} from "ts-morph";
import Singleton from "./annotations/Singleton";
import SingletonDependency from "./dependency/SingletonDependency";
import Produces from "./annotations/Produces";
import ProducesDependency from "./dependency/ProducesDependency";
import DependencyGraph from "./DependencyGraph";

export default function generateFile(project: Project) {
    const graph = new DependencyGraph();
    // 1 - Collect dependencies and their dependencies (@Singleton, @Produces) & Populate data structure.
    const singletons = getSingletons();
    for (const singleton of singletons) {
        graph.addDependency(SingletonDependency.fromClassDeclaration(singleton))
        const products = getProducts(singleton)
        for (const product of products) {
            if(product instanceof MethodDeclaration) {
                graph.addDependency(ProducesDependency.fromMethodDeclaration(singleton, product))
            }else if(product instanceof  PropertyDeclaration) {
                graph.addDependency(ProducesDependency.fromPropertyDeclaration(singleton, product))
            }
        }
    }

    // 2 - Link dependency graph.
    graph.linkGraph()
    graph.debug()

    // 3 - Generate file.
    // ...

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