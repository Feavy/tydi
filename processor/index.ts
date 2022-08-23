import * as ts from 'typescript';
import { Project } from "ts-morph";
import processSingletons from "./singleton/processSingletons";

export default function(program: ts.Program, pluginOptions: {}) {
    console.log("process")
    const project = new Project();
    project.addSourceFilesFromTsConfig("./tsconfig.json");

    processSingletons(project);

    project.getSourceFiles()[0].insertStatements(0, "console.log('This log was added by the processor!');")

    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            return project.getSourceFile(sourceFile.fileName)!.compilerNode;
        };
    };
}