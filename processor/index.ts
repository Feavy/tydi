import * as ts from 'typescript';
import { Project } from "ts-morph";

export default function(program: ts.Program, pluginOptions: {}) {
    const project = new Project();
    project.addSourceFilesFromTsConfig("./tsconfig.json");
    console.log("process")

    project.getSourceFiles()[0].insertStatements(0, "console.log('hello world11!!!');");

    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            return project.getSourceFile(sourceFile.fileName)!.compilerNode;
        };
    };
}