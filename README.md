# `repo-root`

Finds a repository's "root directory".

## Install

```sh
pnpm install repo-root
```

## Usage

```ts
import { repoRoot } from "repo-root";

const root = repoRoot(); // use all defaults
const root2 = repoRoot("/path/to/start"); // explicit directory
```

### Monorepos

If you are working inside a monorepo and you want to have the `repoRoot()` function stop at the root of packages within the repo you can do that with:

```ts
const root = repoRoot({ stopOnMonorepoPackage: true });
```

### Stop Files

By default we are assuming that the versioning system you are using is **Git** so we default to a `stopFile` of `.git/HEAD` which means that a "root directory" will have the this `stopFile`. If you're using something other then **Git** (or you just have a special use case), then you can set the `stopFile` to whatever you like:

```ts
const root = repoRoot({ stopFile: "package.json"} );
```

## Strong Types, Small Docs

Everything in this repo uses strong typing with the intent of having the documentation for the library be _built into_ it's use rather than making for a big README file.
