import { Project } from "ts-morph";
import getSingletons from "./getSingletons";

export default function processSingletons(project: Project) {
    console.log("[processSingletons]");
    const singletons = getSingletons(project);

    singletons.forEach(s => s.debug());
}