import Singleton from "../annotations/Singleton";

@Singleton
export default class DependencyManager {
    private static _instance: DependencyManager;

    private dependencies: Map<string, any> = new Map();

    public constructor() {
        if(DependencyManager._instance != null) {
            throw new Error("DependencyManager has already been instantiated. Use DependencyManager.INSTANCE to get it.")
        }
        DependencyManager._instance = this;
    }

    public register(name: string, dependency: any) {
        this.dependencies.set(name, dependency);
    }

    public get<T>(id: string | { new(...args: any[]): T }): T {
        if(!(typeof id === "string")) id = id.name;
        return this.dependencies.get(id) as T;
    }

    public getAll() {
        return [...this.dependencies.values()];
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

    public static getAll() {
        return this.INSTANCE.getAll();
    }
};
