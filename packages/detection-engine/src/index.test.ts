import { test, describe } from "node:test";
import assert from "node:assert";
import path from "path";
import { scanFiles } from "./index";

describe("scanFiles", () => {
  test("finds an issue in a bad file", async () => {
    const fixturePath = path.join(__dirname, "..", "fixtures", "bad.js");
    const repoRoot = path.join(__dirname, "..", "fixtures");
    
    // We pass just the basename since cwd is repoRoot
    const findings = await scanFiles(["bad.js"], repoRoot);
    
    assert.ok(findings.length > 0, "Should find at least one issue");
    
    const finding = findings[0];
    assert.ok(finding.severity === "low" || finding.severity === "medium" || finding.severity === "high");
    assert.strictEqual(finding.filePath, "bad.js");
    assert.ok(finding.lineStart > 0);
    assert.ok(finding.message.length > 0);
    assert.ok(finding.ruleId.length > 0);
  });

  test("returns empty array for a clean file", async () => {
    const repoRoot = path.join(__dirname, "..", "fixtures");
    const findings = await scanFiles(["good.js"], repoRoot);
    
    assert.strictEqual(findings.length, 0, "Should find zero issues");
  });

  test("throws error when passing a bad path to force semgrep failure", async () => {
    const repoRoot = path.join(__dirname, "..", "fixtures");
    try {
      await scanFiles(["does_not_exist.js"], repoRoot);
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      assert.ok(error.message.includes("Failed to run Semgrep"), "Should throw clear error");
    }
  });
});