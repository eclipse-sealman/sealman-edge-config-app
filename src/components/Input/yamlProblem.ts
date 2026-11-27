import { parseDocument } from "yaml";

export interface YamlProblem {
  message: string;
  /** 1-based */
  line: number;
  /** 1-based */
  column: number;
}

/** Syntax errors of `text` (empty list if it is valid YAML or blank). */
export function yamlProblems(text: string): YamlProblem[] {
  if (text.trim() === "") return [];
  return parseDocument(text).errors.map((error) => ({
    // the parser appends " at line N, column M:" and a code excerpt to the message
    message: error.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, ""),
    line: error.linePos?.[0].line ?? 1,
    column: error.linePos?.[0].col ?? 1,
  }));
}
