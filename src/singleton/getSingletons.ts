import { ClassDeclaration, Project, SourceFile } from "ts-morph";
import Singleton from "./Singleton";
import SingletonAnnotation from "../../example/Singleton";
import SingletonDependency from "./SingletonDependency";

export default function getSingletons(project: Project): Singleton[] {
    const files = project.getSourceFiles();
    const classes = getClasses(files);
    const singletonClasses = classes.filter(c => c.getDecorators().some(d => d.getName() == SingletonAnnotation.name));

    const singletons: Singleton[] = [];
    for(const singletonClass of singletonClasses) {
        const dependencies = getDependencies(singletonClass);
        singletons.push(new Singleton(singletonClass, dependencies));
    }

    return singletons;
}

function getDependencies(clazz: ClassDeclaration) {
    return clazz.getConstructors().flatMap(c => c.getParameters()).map(p => new SingletonDependency(p.getName(), p.getType().getText()));
}

function getClasses(files: SourceFile[]) {
    const classes: ClassDeclaration[] = [];
    for(const file of files) {
        const fileClasses = file.getClasses();
        classes.push(...fileClasses);
    }
    return classes;
}