import Dependency from "./dependency/Dependency";
import SingletonDependency from "./dependency/SingletonDependency";

type type = string;
type name = string;

export default class DependencyGraph {

    public readonly dependencies: Dependency[] = [];
    private readonly dependenciesByName: Map<name, Dependency> = new Map();
    private readonly dependenciesByType: Map<type, Dependency[]> = new Map();

    public addDependency(dependency: Dependency) {
        this.dependencies.push(dependency);
        if (dependency.name) {
            if (this.dependenciesByName.has(dependency.name)) {
                throw new Error(`A dependency already exists for name ${dependency.name} : conflict between\n`
                    + "   " + dependency.declaration.getText()
                    + "\nAND\n"
                    + "   " + this.dependenciesByName.get(dependency.name).declaration.getText())
            }
            this.dependenciesByName.set(dependency.name, dependency);
        }
        for (const type of dependency.types) {
            let list = this.dependenciesByType.get(type.getText());
            if (list == null) {
                list = [];
                this.dependenciesByType.set(type.getText(), list);
            }
            list.push(dependency)
        }
    }

    public getDependencyByName(name: string) {
        return this.dependenciesByName.get(name);
    }

    public getDependency(type: type, name?: name) {
        // Find by type first
        let dependencies = this.dependenciesByType.get(type);
        if (!dependencies) {
            throw new Error(`Found no dependency ${name ? `for ${name}` : ""} of type ${type}`)
        }
        if (dependencies.length === 1) {
            return dependencies[0];
        }

        // Then filter by name
        dependencies = dependencies.filter(d => d.name === name);
        if (dependencies.length == 0) {
            throw new Error(`Found no dependency of type ${type} and name ${name}`)
        }
        if (dependencies.length > 1) {
            throw new Error(`Found multiple (${dependencies.length}) dependencies of type ${type} and name ${name}`)
        }
        return dependencies[0]
    }

    public linkGraph() {
        for (const dependency of this.dependencies) {
            for (const d1 of dependency.dependencies) {
                if (d1.types.length > 1) {
                    throw new Error(`A dependency should have only one type. That is not the case of ${d1.name} in ${dependency.name} which have types ${d1.types.map(d => d.getText())}`)
                }
                const type = d1.types[0]
                try {
                    const d2 = this.getDependency(type.getText(), d1.name);
                    dependency.replace(d1, d2)
                    d2.hasDependent = true
                } catch (e: any) {
                    throw new Error(e.message + " required by\n" + dependency.declaration.getText())
                }
            }
        }

        // Ensure there is no cycle in the graph
        for (const d1 of this.dependencies) {
            for (const d2 of d1.dependencies) {
                const path = this.pathBetween(d2, d1);
                if(path.length > 0) {
                    throw new Error("Found a cyclic dependency: " + [d1].concat(path).map(d => d.name).join(" -> ")+"\nYou may use @Inject to break the cycle.")
                }
            }
        }
    }

    private pathBetween(d1: Dependency, d2: Dependency) {
        if(d1 === d2) return [d1];

        for (const dependency of d1.dependencies) {
            const path = [d1].concat(this.pathBetween(dependency, d2));
            if(path.length > 1) {
                return path;
            }
        }

        return [];
    }

    public get singletons(): SingletonDependency[] {
        return this.dependencies.filter(d => d instanceof SingletonDependency) as SingletonDependency[];
    }

    public get entrypoints(): Dependency[] {
        return this.dependencies.filter(d => !d.hasDependent);
    }

    public debug() {
        for (const dependency of this.dependencies) {
            console.log(dependency.name + " -> " + dependency.dependencies.map(d => d.name).join(", "))
        }
        console.log("ENTRYPOINTS: " + this.entrypoints.map(d => d.name).join(", "))
    }

};