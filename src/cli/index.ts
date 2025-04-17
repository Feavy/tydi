#!/usr/bin/env node

import { Project } from "ts-morph";
import generateCode from "./DependencyInjection";

const project = new Project();

project.addSourceFilesFromTsConfig("./tsconfig.json");

console.log("Generating dependencies file...");

// Create CDI file
const diCode = generateCode(project);

const cdiFile = project.getDirectories()[0].createSourceFile("setup_dependencies.ts", "", {overwrite: true})
cdiFile.addStatements(diCode);
cdiFile.saveSync()

console.log("Dependencies file saved successfully!");