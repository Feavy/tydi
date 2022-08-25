import * as ts from 'typescript';
import { Project } from "ts-morph";
import processSingletons from "./singleton/processSingletons";
import {existsSync} from "fs";

export default function(program: ts.Program, pluginOptions: {}) {
    const directory = program.getCurrentDirectory();

    if(existsSync(directory+"/src/cdi.ts")) {
        console.log("CDI exists. Skipping...");
        return (ctx: ts.TransformationContext) => {
            return (sourceFile: ts.SourceFile) => {
                return sourceFile;
            };
        };
    }

    console.log("process", program.getCurrentDirectory());
    const project = new Project();
    project.addSourceFilesFromTsConfig("./tsconfig.json");

    // Create CDI file
    const cdiFile = project.getDirectories()[0].createSourceFile("cdi.ts")
    cdiFile.addStatements("console.log('[SETUP CDI] Entrypoint2.');\nexport {}");
    cdiFile.saveSync()

    // Process CDI
    processSingletons(project);

    const src = project.getDirectory("src")

    // Inject statement in index
    const index = src.getSourceFile("index.ts") || src.getSourceFile("main.ts")
    index.insertStatements(0, "console.log('This log was added by the processor :O');")

    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            return project.getSourceFile(sourceFile.fileName)!.compilerNode;
        };
    };
}
