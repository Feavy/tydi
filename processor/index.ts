import * as ts from 'typescript';
import { Project } from "ts-morph";
import processSingletons from "./singleton/processSingletons";

export default function(program: ts.Program, pluginOptions: {}) {
    const project = new Project();
    project.addSourceFilesFromTsConfig("./tsconfig.json");
    console.log("process")
    processSingletons(project);
    console.log("process after")

    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            return project.getSourceFile(sourceFile.fileName)!.compilerNode;
        };
    };
}