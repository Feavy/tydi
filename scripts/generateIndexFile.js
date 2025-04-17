/**
 * Inspired by https://github.com/pixijs/pixijs/blob/v8.0.0-beta.3/scripts/index/generateIndexFiles.ts
 * -------------------------------------------------------
 * Generates the index.ts files for the library with
 * all the exports defined
 *
 * We do this to avoid having to manually maintain the index.ts
 * files and reduce circular dependencies
 */

import fs from 'fs';
import glob from 'glob';
import path from 'path';

const directoryPath = path.join(process.cwd(), './src'); // Replace with your directory path
const indexFilePath = path.join(directoryPath, 'index.ts');

// Use glob to find all TypeScript files recursively in the directory
const files = glob.sync('**/*.ts', { cwd: directoryPath });

// Generate export statements for each file
const exportStatements = files.map((file) => {
  const pathName = file.replace(/\.ts$/, '');
  const content = fs.readFileSync(path.resolve(directoryPath, file), { encoding: 'utf-8' });
  if(content.includes("namespace")) {
    return `import './${pathName}';`;
  }
  if(content.includes('export default')) {
    const fileName = pathName.split('/').pop();
    return `export { default as ${fileName} } from './${pathName}';`
  }
  return `export * from './${pathName}';`;
});

exportStatements.push(`import registerSerializers from './serialization/registerSerializers';`)
exportStatements.push("registerSerializers();");

// Write the export statements to the index.ts file
fs.writeFileSync(indexFilePath, exportStatements.join('\n'), { encoding: 'utf-8' });