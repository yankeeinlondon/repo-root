import { createKindError } from "@yankeeinlondon/kind-error";

export const InvalidPath = createKindError(
  "InvalidPath",
  { library: "root-repo" },
);

export const NotFound = createKindError(
  "NotFound",
  { library: "root-repo" },
);
