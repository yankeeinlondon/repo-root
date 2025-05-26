import { describe, it, expect, afterEach } from "vitest";
import { repoRoot } from "~/index";
import { join } from "path";
import { 
    existsSync, 
    mkdirSync, 
    writeFileSync, 
    unlinkSync, 
    rmdirSync 
} from "fs";
import os from "os";

const TMP = join(os.tmpdir(), `reaper_repoRoot_test_${process.pid}`);
const GIT_DIR = join(TMP, ".git");
const GIT_HEAD = join(GIT_DIR, "HEAD");
const PKG_JSON = join(TMP, "package.json");
const SUBDIR = join(TMP, "subdir");

function setupGitRepo() {
  if (!existsSync(TMP)) mkdirSync(TMP);
  if (!existsSync(GIT_DIR)) mkdirSync(GIT_DIR);
  writeFileSync(GIT_HEAD, "ref: refs/heads/main\n", "utf-8");
  if (!existsSync(SUBDIR)) mkdirSync(SUBDIR);
}

function setupPkgRepo() {
  if (!existsSync(TMP)) mkdirSync(TMP);
  writeFileSync(PKG_JSON, '{"name": "test"}', "utf-8");
  if (!existsSync(SUBDIR)) mkdirSync(SUBDIR);
}

function cleanup() {
  if (existsSync(GIT_HEAD)) unlinkSync(GIT_HEAD);
  if (existsSync(GIT_DIR)) rmdirSync(GIT_DIR);
  if (existsSync(PKG_JSON)) unlinkSync(PKG_JSON);
  if (existsSync(SUBDIR)) rmdirSync(SUBDIR);
  if (existsSync(TMP)) rmdirSync(TMP);
}

describe("repoRoot", () => {
  afterEach(() => cleanup());

  it("finds the root by .git/HEAD from a subdirectory", () => {
    setupGitRepo();

    const found = repoRoot({ path: SUBDIR });
    expect(found).toBe(TMP);
  });

it("finds the root by .git/HEAD from a subdirectory (using string based option)", () => {
    setupGitRepo();
    const found = repoRoot(SUBDIR);
    expect(found).toBe(TMP);
  });

  it("finds the root by .git/HEAD from the root itself", () => {
    setupGitRepo();
    const found = repoRoot({ path: TMP });
    expect(found).toBe(TMP);
  });

  it("finds the root by package.json if .git/HEAD is not present", () => {
    setupPkgRepo();
    const found = repoRoot({ path: SUBDIR, stopFile: "package.json" });
    expect(found).toBe(TMP);
  });

  it("throws if no root is found", () => {
    if (!existsSync(TMP)) mkdirSync(TMP);
    if (!existsSync(SUBDIR)) mkdirSync(SUBDIR);
    expect(() => repoRoot({ path: SUBDIR, stopFile: "notfound.txt" })).toThrow();
  });

  it("defaults to cwd if no path is given (and throws if not a repo)", () => {
    expect(() => repoRoot({ stopFile: "notfound.txt" })).toThrow();
  });
});
