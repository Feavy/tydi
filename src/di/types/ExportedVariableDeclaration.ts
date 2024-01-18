import {VariableDeclaration} from "ts-morph";

type ExportedVariableDeclaration = {
  name: string;
  declaration: VariableDeclaration;
}

export default ExportedVariableDeclaration;