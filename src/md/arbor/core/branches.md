---
title: "Branches"
description: "How Arbor structures applications and groups behavior."
order: 1
---

# Branches

Branches define the structure of an Arbor application. Each branch represents a section of the URL space and can attach actions, routes, error handlers and renderers. Branches form a tree that Arbor resolves for each incoming request.

## Basic usage

A branch provides a URL prefix and optional shared behavior.

```ts
// app.ts
import { createApp, createBranch } from "@kequtech/arbor";

const branchApi = createBranch({
  url: "/api",
  routes: [
    {
      method: "GET",
      url: "/status",
      actions: [() => "OK"],
    },
  ],
});

export default createApp({
  branches: [branchApi],
});
````

Requests to `/api/status` match this branch and then its route.

## Shared behavior

A branch can attach actions that apply to all routes inside that same branch. This avoids duplication and keeps behavior consistent.

```ts
import { createAction, createBranch } from "@kequtech/arbor";

const actionSetJson = createAction({ res }) => {
  res.setHeader("Content-Type", "application/json");
});

const branchApi = createBranch({
  url: "/api",
  actions: [actionSetJson],
  routes: [
    {
      method: "GET",
      url: "/status",
      actions: [() => ({ ok: true })],
    },
  ],
});
```

Every route defined inside `branchApi` will now default to JSON responses unless overridden.

> Branches do not share actions with other branches that happen to use a similar URL. Arbor does not infer hierarchy from URL patterns. Structure is explicit.

## Combining branches

You can register multiple branches on the same application. Arbor merges them into a single routing structure. It does not automatically nest them based on their URLs.

```ts
import { createAction, createApp, createBranch } from "@kequtech/arbor";

const branchApi = createBranch({
  url: "/api",
  actions: [actionSetJson],
  routes: [
    {
      method: "GET",
      url: "/status",
      actions: [() => ({ ok: true })],
    },
  ],
});

const branchUsers = createBranch({
  url: "/api/users",
  routes: [
    {
      method: "GET",
      url: "/",
      actions: [() => ({ users: [] })],
    },
  ],
});

export default createApp({
  branches: [branchApi, branchUsers],
});
```

In this example:

* `/api/status` uses `actionSetJson`.
* `/api/users` does not. It only uses the actions defined inside `branchUsers`.

If you want `/api/users` to share the same behavior as `/api`, either:

* put the routes for `/api/users` inside `branchApi`, or
* nest a users branch inside `branchApi` explicitly.

## Nested branches

To share behavior, nest branches rather than relying on similar paths.

```ts
import { createApp, createBranch } from "@kequtech/arbor";

const branchUsers = createBranch({
  url: "/users",
  routes: [
    {
      method: "GET",
      url: "/",
      actions: [() => ({ users: [] })],
    },
  ],
});

const branchApi = createBranch({
  url: "/api",
  actions: [actionSetJson],
  branches: [branchUsers],
});

export default createApp({
  branches: [branchApi],
});
```

Now a request to `/api/users` runs:

1. `branchApi` actions (including `actionSetJson`), then
2. `branchUsers` routes and actions.

## Logger

Branches accept an optional `logger` object. It must implement `info`, `warn` and `error`. Arbor uses this logger internally for startup messages, route warnings and unexpected failures.

```ts
import { type Logger, createBranch } from "@kequtech/arbor";

const logger: Logger = {
  info: (message) => console.log("[info]", message),
  warn: (message) => console.warn("[warn]", message),
  error: (message) => console.error("[error]", message),
};

const branchApi = createBranch({
  url: "/api",
  logger,
});
```

The logger is not part of the request bundle and is not used inside actions. It exists only for branch-level reporting.

## autoHead

Branches support `autoHead`, which controls whether missing HEAD definitions fall back to matching GET routes inside that branch.

```ts
const branchFiles = createBranch({
  url: "/files",
  autoHead: false,
});
```

Setting it to false prevents Arbor from using GET routes to satisfy HEAD requests inside `branchFiles`.

## Error handlers and renderers

A branch can provide its own error handlers or renderers. These apply only to requests that flow through that branch and its nested branches.

```ts
const branchDocs = createBranch({
  url: "/docs",
  renderers: [rendererHtml],
  errorHandlers: [errorHandlerHtml],
});
```

## Summary

Branches let you:

* group behavior by URL prefix
* share actions within that branch and its nested branches
* structure large applications without confusion
* control Content-Type handling, renderers and error policies per section

Arbor does not infer nesting from similar URLs. To share behavior, you either define routes inside the same branch or nest branches explicitly.
