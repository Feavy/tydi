import { Project } from "ts-morph";
import { getProviders } from "./getProviders";
import getSingletons from "./getSingletons";

export default function processSingletons(project: Project) {
    console.log("[processSingletons]");
    const singletons = getSingletons(project);
    singletons.forEach(s => s.debug());

    const providers = getProviders(singletons);
    console.log(providers);
}