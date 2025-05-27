import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { getMonorepoPackages, isMonorepo } from "@yankeeinlondon/is-monorepo";
import { hasIndexOf, isDefined, isObject, isString } from "inferred-types";
import { InvalidPath, NotFound } from "~/errors";

export interface RepoRootOption {
  /**
   * _optionally_ provide a file path to start the search for
   * a the root repo directory.
   */
  path?: string;
  /**
   * By default **repo-root** will move up the directory stack
   * until it finds a directory which has the appropriate signature
   * of being a repository (by default this is `.git/HEAD`).
   *
   * However, when working with monorepos, sometimes you may want
   * to terminate at the first sub-directory where a monorepo's
   * package/module starts.
   *
   * Setting this property to `true` will change to this behavior
   * assuming that the root of the package can be identified and
   * the monorepo configuration file is found there.
   *
   * We support the following monorepos:
   *
   * - `lerna`, `nx`, `turbo`, `rush`, `pnpm`
   */
  stopOnMonorepoPackage?: boolean;

  /**
   * When using **git** as your version control system, the
   * `.git/HEAD` file is a good "stopFile" (aka, a file indicating
   * you've reached the root of the repo).
   *
   * For this reason, we use `.git/HEAD` as the default **stopFile**
   * but you can modify this if you need to adjust.
   */
  stopFile?: string;
}

/**
 * Recurses up parent directories until it runs out of directories
 * or it finds the `stopFile`.
 *
 * - returns the directory if it finds it
 * - returns `false` if not found
 */
function findRoot(start: string, stopFile: string): string | false {
  let dir = start;
  let prev: string | undefined;
  while (true) {
    const candidate = join(dir, stopFile);
    if (existsSync(candidate)) {
      return dir;
    }
    prev = dir;
    dir = join(dir, "..");
    dir = statSync(dir).isDirectory() ? dir : prev;
    // If we've reached the filesystem root, stop
    if (dir === prev) {
      break;
    }
  }
  return false;
}

/**
 * **repoRoot**`(path) -> string`
 *
 * **repoRoot**`({ options }) -> string`
 *
 * Finds where the _root directory_ of the **repo** is.
 *
 * - if no path is provided then the _starting point_ for the search
 * will be the _current working directory_
 * - the repo's root is determined by the first directory found which
 * has `.git` directory with a `HEAD` file inside of it.
 *      - this is a good way to detect GIT repos but if you're using a
 *        version control system other than `git` you can
 *
 */
export function repoRoot(pathOrOpt?: string | RepoRootOption) {
  const userPath: string | undefined = isString(pathOrOpt)
    ? pathOrOpt.startsWith(".")
      ? join(cwd(), pathOrOpt)
      : pathOrOpt as string
    : isObject(pathOrOpt) && hasIndexOf(pathOrOpt, "path")
      ? isString(pathOrOpt.path)
        ? pathOrOpt.path.startsWith(".")
          ? join(cwd(), pathOrOpt.path)
          : pathOrOpt.path
        : undefined
      : undefined;

  if (userPath && !existsSync(userPath)) {
    throw InvalidPath(`the path passed into repoRoot("${userPath}") is not a valid path on the system!`);
  }

  if (userPath && !statSync(userPath).isDirectory()) {
    throw InvalidPath(`the path passed into repoRoot("${userPath}") exists but is NOT a directory!`);
  }

  const dir = userPath || cwd();

  const stopFile = isObject(pathOrOpt) && isString(pathOrOpt.stopFile)
    ? pathOrOpt.stopFile
    : ".git/HEAD";

  const root = findRoot(dir, stopFile);

  if (!root) {
    throw NotFound(`No repo root was found in "${dir}" or it's parent directories!`, { stopFile });
  }

  if (isObject(pathOrOpt) && pathOrOpt.stopOnMonorepoPackage) {
    const mono = isMonorepo(root);
    if (mono) {
      const packages = Object.values(
        getMonorepoPackages(root),
      ).map(i => join(dir, i));

      const found = packages.find(i => dir.startsWith(i));
      if (found) {
        return found;
      }
      else {
        return root;
      }
    }
    return root;
  }
  return root;
}
