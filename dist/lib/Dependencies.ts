import Singleton from "../di/annotations/Singleton";

/**
 * Dependency Manager
 *
 * Use it to get dependencies programmatically, at runtime.
 */
@Singleton
export default class Dependencies {
    private static _instance: Dependencies;

    private dependencies: Map<string, any> = new Map();

    public constructor() {
        if(Dependencies._instance != null) {
            throw new Error("Dependencies has already been instantiated. Use Dependencies.INSTANCE to get it.")
        }
        Dependencies._instance = this;
    }

    public register(name: string, dependency: any) {
        this.dependencies.set(name, dependency);
    }

    public get<T>(id: string | { new(...args: any[]): T }): T {
        if(!(typeof id === "string")) id = id.name;
        return this.dependencies.get(id) as T;
    }

    public list() {
        return [...this.dependencies.values()];
    }

    public map() {
        return new Map(this.dependencies);
    }

    public static get INSTANCE() {
        return this._instance;
    }

    public static register(name: string, dependency: any) {
        this.INSTANCE.register(name, dependency);
    }

    public static get<T>(id: string | { new(...args: any[]): T }): T  {
        return this.INSTANCE.get(id);
    }

    public static list() {
        return this.INSTANCE.list();
    }

    public static map() {
        return this.INSTANCE.map();
    }
};
