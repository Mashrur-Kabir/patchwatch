import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type FindingSeverity = "low" | "medium" | "high" | "critical";

export interface Finding {
  severity: FindingSeverity;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  message: string;
  ruleId: string;
}

export async function scanFiles(
  filePaths: string[],
  repoRootPath: string
): Promise<Finding[]> {
  if (filePaths.length === 0) {
    return [];
  }

  let stdout: string;
  let stderr: string;

  try {
    const result = await execFileAsync(
      "semgrep",
      ["--config", "auto", "--json", ...filePaths],
      { cwd: repoRootPath, maxBuffer: 1024 * 1024 * 50 } // 50MB buffer for large JSON outputs
    );
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error: any) {
    // semgrep exits with code 1 if findings are found, which causes execFile to throw.
    // We only throw if it's an actual failure (e.g. command not found, syntax error, exit code 2+)
    if (error.code && error.code !== 1 && error.code !== 0) {
      throw new Error(`Failed to run Semgrep: ${error.message}`);
    }
    
    // Command not found throws with error.code === 'ENOENT'
    if (error.code === 'ENOENT') {
      throw new Error(`Semgrep is not installed or not in PATH`);
    }

    // It exited with code 1 (findings found) or some other error with stdout
    if (!error.stdout) {
       throw new Error(`Failed to run Semgrep: ${error.message}`);
    }

    stdout = error.stdout;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
  } catch (err) {
    throw new Error(`Failed to parse Semgrep JSON output: ${err}`);
  }

  const findings: Finding[] = [];
  const results = parsed.results || [];

  for (const result of results) {
    let severity: FindingSeverity = "low";
    const semgrepSev = result.extra?.severity;

    if (semgrepSev === "WARNING") severity = "medium";
    else if (semgrepSev === "ERROR") severity = "high";

    findings.push({
      severity,
      filePath: result.path,
      lineStart: result.start?.line || 0,
      lineEnd: result.end?.line || result.start?.line || 0,
      message: result.extra?.message || "",
      ruleId: result.check_id || "",
    });
  }

  return findings;
}