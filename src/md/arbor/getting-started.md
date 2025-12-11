---
title: "Getting Started"
description: "Install Arbor, create an application, and understand the minimal setup."
order: 2
---

# Getting Started

Arbor works directly with Node's HTTP server. You define routes and actions, and Arbor executes them in a clear sequence. This page shows the minimal setup required to get an application running.

## Installation

```bash
npm i @kequtech/arbor
````

## Project Layout

A simple Arbor project uses two files. One file starts the HTTP server. The other defines the Arbor application. This keeps the application testable without involving network code.

```
project/
- server.ts
- app.ts
```

## A Minimal Application

```ts
// server.ts
import { createServer } from "node:http";
import app from "./app.ts";

createServer(app).listen(4000, () => {
  console.log("Listening on http://localhost:4000");
});
```

```ts
// app.ts
import { createApp } from "@kequtech/arbor";

export default createApp({
  routes: [
    {
      method: "GET",
      url: "/",
      actions: [() => "Hello world"],
    },
  ],
});
```

Run the server:

```bash
node server.ts
```

Visit:

```
http://localhost:4000/
```

Arbor resolves both GET and HEAD requests through this route by default.

## Adding Behavior With Actions

Actions define the logic for a request. They can modify headers, read the body, produce a payload or finalize the response.

```ts
// app.ts
import { createApp, createAction } from "@kequtech/arbor";

const actionSetJson = createAction(({ res }) => {
  res.setHeader("Content-Type", "application/json");
});

export default createApp({
  routes: [
    {
      method: "GET",
      url: "/status",
      actions: [
        actionSetJson,
        () => ({ ok: true }),
      ],
    },
  ],
});
```

Arbor selects an appropriate renderer based on the Content-Type set by the `res` header.

## Async actions

Actions may be asynchronous. Arbor waits for each one before running the next.

```ts
// example: loading data asynchronously
const actionLoadUser = createAction(async ({ params, context }) => {
  context.user = await db.findUser(params.id);
});

const routeUser = createRoute({
  method: "GET",
  url: "/users/:id",
  actions: [
    actionLoadUser,
    ({ context }) => ({ user: context.user }),
  ],
});
````

Async actions behave exactly like synchronous ones: return a value to finish, throw to signal an error, or let the chain continue.

## Grouping Routes With Branches

Branches let you organize related routes and share actions. They attach behavior to a URL prefix and apply it consistently.

```ts
// app.ts
import { createApp, createBranch } from "@kequtech/arbor";

const branchApi = createBranch({
  url: "/api",
  actions: [actionSetJson],
  routes: [
    {
      method: "GET",
      url: "/users",
      actions: [() => ({ users: [] })],
    },
  ],
});

export default createApp({
  branches: [branchApi]
});
```

## Reading the Request Body

Arbor only parses the body when you ask for it. Use `getBody` inside an action.

```ts
// app.ts
import { createAction, createApp } from "@kequtech/arbor";

const actionUsers = createAction(async ({ getBody }) => {
  const body = await getBody({ trim: true });
  return `Received ${body.name}`;
});

export default createApp({
  routes: [
    {
      method: "POST",
      url: "/users",
      actions: [actionUsers],
    },
  ],
});
```

`getBody` supports multipart uploads, raw buffers, normalization, validation maps and optional non-throwing behavior. These are explained in detail in the Body section.

## Where to Go Next

Move to Core to learn Arbor’s building blocks in depth:

* Branches
* Routes
* Actions
* Request Bundle
* Body
* Renderers
* Errors
* Static Files

Once you understand those pieces, the Guides section shows recommended patterns for real applications.
