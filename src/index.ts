import * as ts from 'typescript';
import {Project} from "ts-morph";
import {existsSync} from "fs";
import * as DependencyInjection from "./di/DependencyInjection"

export function createSetupDependenciesFile() {
    const project = new Project();

    project.addSourceFilesFromTsConfig("./tsconfig.json");

    console.log("Generating dependencies file...");

    // Create CDI file
    const diCode = DependencyInjection.default(project);

    const cdiFile = project.getDirectories()[0].createSourceFile("setup_dependencies.ts", "", {overwrite: true})
    cdiFile.addStatements(diCode);
    cdiFile.saveSync()

    console.log("Dependencies file saved successfully!");

    const src = project.getDirectory("src");
    const index = src.getSourceFile("index.ts") || src.getSourceFile("index.tsx") || src.getSourceFile("main.ts") || src.getSourceFile("main.tsx");
    const firstStatement = index.getStatements()[0];
    if(firstStatement.getText() === "import \"./setup_dependencies\";") {
        return;
    }
    index.insertStatements(0, "import \"./setup_dependencies\";");
    index.saveSync()
}

export default function (program: ts.Program, pluginOptions: {}) {
    const directory = program.getCurrentDirectory();

    const project = new Project();
    project.addSourceFilesFromTsConfig("./tsconfig.json");

    if (!existsSync(directory + "/src/setup_dependencies.ts")) {
        console.log("Generating dependencies file...");

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
    const index = src.getSourceFile("index.ts") || src.getSourceFile("index.tsx") || src.getSourceFile("main.ts") || src.getSourceFile("main.tsx");
    index.insertStatements(0, "import \"./setup_dependencies\";");
    // index.saveSync()

    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            return project.getSourceFile(sourceFile.fileName)!.compilerNode;
        };
    };
}
