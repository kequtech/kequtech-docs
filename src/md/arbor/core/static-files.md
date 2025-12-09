---
title: "Static Files"
description: "Serving files and directories using Arbor's staticDirectory and sendFile utilities."
order: 8
---

# Static Files

Arbor provides two utilities for serving files: `staticDirectory` and `sendFile`. Both stream files directly using Node's filesystem APIs and work inside normal action chains. Static serving is explicit and predictable.

## staticDirectory

`staticDirectory` exposes a directory through a wildcard route. The route must end in `/**` so that `params.wild` contains the requested file path.

```ts
import { createRoute, staticDirectory } from "@kequtech/arbor";

const actionStatic = staticDirectory({
  location: "/public",
  index: ["index.html"],
  contentTypes: {
    ".3gp": "audio/3gpp",
  },
});

const routeStatic = createRoute({
  method: "GET",
  url: "/assets/**",
  actions: [
    actionStatic,
  ],
});
````

### How it resolves files

1. The directory root is computed once from `process.cwd()` and the `location` option.
2. The `wild` parameter is interpreted as a **relative path** under this root.
3. If `wild` attempts to escape the root (such as via `../../`), Arbor throws `Ex.Forbidden`.
4. If the resolved path is a directory and an index list is provided, Arbor returns the first matching index file.
5. If the resolved path is a file, it is returned.
6. Otherwise Arbor throws `Ex.NotFound`.

This ensures predictable resolution without exposing unintended parts of the filesystem.

### Content-Type resolution

`staticDirectory` determines the content type using a non-exhaustive list of common file extensions. You can provide custom extensions through `contentTypes`.

```ts
contentTypes: {
  ".svgz": "image/svg+xml",
}
```

### Error behavior

* Missing files → `NotFound`
* Invalid paths or traversal → `Forbidden`
* Valid file but stream failure → handled by `sendFile` (InternalServerError)

All thrown errors enter Arbor’s normal error-handling pipeline.

### GET and HEAD

`staticDirectory` supports HEAD automatically because `sendFile` finalizes HEAD responses without writing a body.

### Prep actions

You can add your own actions before the generated action:

```ts
const actionCache = createAction(({ res }) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
});

const routeStatic = createRoute({
  method: "GET",
  url: "/assets/**",
  actions: [
    actionCache,
    actionStatic,
  ],
});
```

This lets you control caching, cookies, authentication, or other behavior.

## sendFile

Use `sendFile` when you want to explicitly stream a single file inside of an action.

```ts
const routeDownload = createRoute({
  method: "GET",
  url: "/download/config.json",
  actions: [
    async ({ req, res }) => {
      await sendFile(req, res, "/data/config.json", "application/json");
    },
  ],
});
```

### Behavior

`sendFile`:

1. Resolves the path under `process.cwd()`.
2. Ensures the path refers to a file via `stat()`.
3. Sets `Content-Type` (guessed or explicit).
4. Sets `Content-Length`.
5. On HEAD, ends immediately.
6. On GET, streams the file and finalizes the response.

### Error behavior

* File not found → NotFound
* Not a file → NotFound
* Stream error → InternalServerError

### Bypassing renderers

A successful `sendFile` call finalizes the response directly. No renderer runs afterward.

## Summary

`staticDirectory`

* Maps requests to files under a directory
* Protects against path traversal
* Supports index files
* Guesses MIME types
* Integrates with normal actions

`sendFile`

* Streams a single file
* Supports custom MIME types
* Throws an error on failure
* Finalizes the response when successful

Both tools are small, explicit and predictable, matching Arbor’s overall design philosophy.
