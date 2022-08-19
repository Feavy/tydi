import { Project } from "ts-morph";
import processSingletons from "./singleton/processSingletons";

const project = new Project();
project.addSourceFilesAtPaths("example/*.ts");

processSingletons(project);
