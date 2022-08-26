import * as ts from 'typescript';
import {Project} from "ts-morph";
import {existsSync} from "fs";
import * as DependencyInjection from "./di/DependencyInjection"

export default function (program: ts.Program, pluginOptions: {}) {
    const directory = program.getCurrentDirectory();

    const project = new Project();
    project.addSourceFilesFromTsConfig("./tsconfig.json");

    if (!existsSync(directory + "/src/setup_dependencies.ts")) {
        console.log("Generating dependencies file...");
        // return (ctx: ts.TransformationContext) => {
        //     return (sourceFile: ts.SourceFile) => {
        //         return sourceFile;
        //     };
        // };

        // Create CDI file
        const diCode = DependencyInjection.default(project);

        const cdiFile = project.getDirectories()[0].createSourceFile("setup_dependencies.ts")
        cdiFile.addStatements(diCode);
        cdiFile.saveSync()
    } else {
        console.log("Dependencies file already exists. Skipping.")
    }

    // Inject statement in index
    const src = project.getDirectory("src");
    const index = src.getSourceFile("index.ts") || src.getSourceFile("main.ts");
    index.insertStatements(0, "import \"./setup_dependencies\";");
    // index.saveSync()

    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            return project.getSourceFile(sourceFile.fileName)!.compilerNode;
        };
    };
}
