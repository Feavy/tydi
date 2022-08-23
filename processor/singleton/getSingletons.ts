import { ClassDeclaration, Project, SourceFile } from "ts-morph";
import SingletonClass from "./SingletonClass";
import SingletonDependency from "./SingletonDependency";
import Singleton from "./Singleton";

export default function getSingletons(project: Project): SingletonClass[] {
    const files = project.getSourceFiles();
    const classes = getClasses(files);
    const singletonClasses = classes.filter(c => c.getDecorators().some(d => d.getName() == Singleton.name));

    const singletons: SingletonClass[] = [];
    for(const singletonClass of singletonClasses) {
        const dependencies = getDependencies(singletonClass);
        singletons.push(new SingletonClass(singletonClass, dependencies));
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