---
title: "Writing Modular APIs"
description: "A practical project structure for building larger Arbor applications."
order: 2
---

# Writing Modular APIs

Arbor does not enforce a project structure. It only cares about branches, routes and actions at runtime. How you arrange files is your choice.

This guide describes one structure that works well for larger applications:

- predictable file locations  
- URLs mapped to directories  
- clear separation of server, app and view concerns  

Use it as a starting point and adapt it to your needs.

## Top-level layout

A simple layout:

```
src/
- server.ts
- app.ts
- app/
- - dashboard/
- - - action.ts
- - api/
- - - branch.ts
- - - users/
- - - - action.ts
- - - - branch.ts
- - - - create/
- - - - - action.ts
````

- `/src/server.ts` creates the HTTP server.  
- `/src/app.ts` builds the Arbor app (branches, routes, error handlers).  
- `/src/app/` mirrors your URLs.

This keeps the entry points obvious and lets you more easily navigate the filesystem.

## Entry points

```ts
// src/server.ts
import { createServer } from "node:http";
import app from "./app";

createServer(app).listen(4000, () => {
  console.log("Listening on http://localhost:4000");
});
````

```ts
// src/app.ts
import { createApp } from "@kequtech/arbor";
import branchApi from "./app/api/branch.ts";
import actionDashboard from "./app/dashboard/action.ts";

export default createApp({
  routes: [
    {
      method: "GET",
      url: "/dashboard",
      actions: [
        actionDashboard,
      ],
    },
  ],
  branches: [
    branchApi,
  ],
});
```

## Mapping URLs to directories

Under `/src/app`, each directory represents a part of the URL:

* `/dashboard` → `/src/app/dashboard`
* `/api/users` → `/src/app/api/users`
* `/api/users/create` → `/src/app/api/users/create`

Inside each directory:

* `action.ts` defines the action.
* `branch.ts` defines a branch for that subtree when needed.
* Optional view-related files (`page.mustache`, `page.client.ts`) can live in the same directory.

Example:

```
src/app/
- dashboard/
- - action.ts
- - page.mustache
- - page.client.ts
```

### Simple action example

```ts
// src/app/dashboard/action.ts
import { createAction } from "@kequtech/arbor";

export default createAction(() => {
  return "Dashboard";
});
```

In this case `app.ts` imports `actionDashboard` and registers it.

## Branch files

For sections of the API that share behavior, define a `branch.ts` in the directory that represents the prefix. Example API tree:

```
src/app/api/
- branch.ts
- users/
- - action.ts
- - branch.ts
- - create/
- - - action.ts
```

`/api` branch:

```ts
// src/app/api/branch.ts
import { createBranch } from "@kequtech/arbor";
import branchUsers from "./users/branch.ts";

export default createBranch({
  url: "/api",
  branches: [
    branchUsers,
  ],
});
```

`/api/users` branch:

```ts
// src/app/api/users/branch.ts
import { createBranch } from "@kequtech/arbor";
import actionUsers from "./action.ts";
import actionUsersCreate from "./create/action.ts";

export default createBranch({
  url: "/users",
  routes: [
    {
        method: "GET",
        url: "/",
        actions: [
            actionUsers,
        ],
    },
    {
        method: "POST",
        url: "/",
        actions: [
            actionUsersCreate,
        ],
    },
  ],
});
```

`/api/users` action:

```ts
// src/app/api/users/action.ts
import { createAction } from "@kequtech/arbor";

export default createAction(() => {
  return [{ id: 1, name: "User" }];
});
```

`/api/users/create` action:

```ts
// src/app/api/users/create/action.ts
import { createAction } from "@kequtech/arbor";

export default createAction(async ({ getBody }) => {
  const body = await getBody({ trim: true, required: ["name"] });
  return { created: body.name };
});
```

This pattern keeps each action small and easy to locate.

## Co-locating views and client code

If a route has a server-rendered page or client-side behavior, keep those files in the same directory:

```
src/app/dashboard/
- action.ts           // action logic
- page.mustache       // template for HTML
- page.client.ts      // client-side behavior for this page
```

Your action might use a renderer that knows how to load `page.mustache` from this directory.

```ts
// src/app/dashboard/action.ts
import { createAction } from "@kequtech/arbor";
import type { HtmlPayload } from "#lib/html-renderer.ts";

export default createAction(({ context }): HtmlPayload => {
  context.view = "dashboard/page.mustache";
  return { title: "Dashboard" };
});
```

A renderer can then use `context.view` and the payload to render HTML.

```ts
// src/lib/html-renderer.ts
import { createRenderer } from "@kequtech/arbor";

export interface HtmlPayload {
  title: string;
}

export const rendererHtml = createRenderer({
  contentType: 'text/html',
  action: async (payload, { context }) => {
    const { title } = payload as HtmlPayload;
    const view = context.view as string | undefined;
    // etc.
  },
});
```

## Shared modules

For cross-cutting concerns, use a `src/lib` or `src/shared` directory:

```
src/
- app.ts
- server.ts
- app/
- - ...
- lib/
- - auth.ts
- - db.ts
- - validators.ts
```

Examples:

* `lib/auth.ts` for `actionAuthRequired` and role checks
* `lib/db.ts` for database access helpers
* `lib/validators.ts` for reusable input validators

Shared modules often define small context interfaces. Actions that depend on these
properties can use a context hint:

```ts
// src/lib/auth.ts
export interface ContextAuth {
  user: { id: string };
}

export const actionAuth = createAction(({ context, cookies }) => {
  const token = cookies.get("auth");
  const user = getUserFromToken(token);
  if (!user) throw Ex.unauthorized("Invalid auth token");

  context.user = user;
});
```

```ts
// src/app/dashboard/action.ts
import type { ContextAuth } from "#lib/auth.ts";

export default createAction<ContextAuth>(({ context }) => {
  context.user; // { id: string }
});
```

Context hints make cross-module assumptions visible without requiring a global context type.
For more guidance on typing patterns, see **Types**.

## Testing structure

Can also choose to add tests to the file layout:

```
src/
- app/
- - api/
- - - users/
- - - - action.ts
- - - - action.test.ts
```

Co-locating tests with actions keeps everything close to the code that it verifies.

## Summary

A practical Arbor layout:

* `/src/server.ts` for the HTTP server
* `/src/app.ts` for building the Arbor app
* `/src/app/**` where directories mirror URLs
* `action.ts` and `branch.ts` files inside those directories
* optional `page.mustache`, `page.client.ts`, and `action.test.ts` co-located with routes
* shared logic in `/src/lib` or `/src/shared`

This structure is not required by Arbor, but it scales well and makes it easy to locate behavior from looking at the URL.
