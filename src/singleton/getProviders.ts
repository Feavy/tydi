import ProvidesAnnotation from "../../example/Provides";
import Singleton from "./Singleton";

export function getProviders(singletons: Singleton[]) {
    const providers: any[] = [];

    for(const singleton of singletons) {
        // PROPERTIES
        const properties = singleton.clazz.getProperties();
        for(const property of properties) {
            if(property.getDecorators().some(d => d.getName() == ProvidesAnnotation.name)) {
                const name = property.getName();
                const type = property.getType().getText();
                providers.push({ name, type });
            }
        }

        // METHODS
        const methods = singleton.clazz.getMethods();
        for(const method of methods) {
            if(method.getDecorators().some(d => d.getName() == ProvidesAnnotation.name)) {
                let name = method.getName();
                if(name.startsWith("get")) {
                    name = name.substring(3);
                    name = name[0].toLowerCase() + name.substring(1);
                }
                const type = method.getReturnType().getText();
                providers.push({ name, type });
            }
        }
    }

    return providers;
}