import { ExportedDeclarations } from "ts-morph";

type ExportedDeclaration = {
  name: string;
  declaration: ExportedDeclarations;
}

export default ExportedDeclaration;