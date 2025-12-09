---
title: "Routes"
description: "Define endpoints and attach action sequences that execute for matching requests."
order: 2
---

# Routes

Routes define individual endpoints in Arbor. A route specifies an HTTP method, a URL pattern and a sequence of actions that Arbor executes in order when the route matches a request.

## Basic Route

```ts
// app.ts
import { createApp, createRoute } from "@kequtech/arbor";

const routeRoot = createRoute({
  method: "GET",
  url: "/",
  actions: [() => "Hello world"],
});

export default createApp({
  routes: [routeRoot],
});
````

A route matches only when both the method and URL match the incoming request.

## URL Patterns

Route URLs must begin with a leading slash. Arbor supports:

### Static paths

```ts
url: "/status",
```

### Named parameters

```ts
url: "/users/:id",
```

The parameter name becomes available as a string `params.id`.

### Wildcards

```ts
url: "/assets/**",
```

Everything after the prefix (including leading slash) is provided as `params.wild`.

## Parameters Example

```ts
const routeGetUser = createRoute({
  method: "GET",
  url: "/users/:userId",
  actions: [
    ({ params }) => ({ id: params.userId }),
  ],
});
```

Arbor does not guess or coerce parameter types. All params are strings.

## Action Sequence

A route defines the sequence of actions for that endpoint. Actions run in the order they appear.

```ts
const actionSetJson = createAction(({ res }) => {
  res.setHeader("Content-Type", "application/json");
});

const routeGetUsers = createRoute({
  method: "GET",
  url: "/users",
  actions: [
    actionSetJson,
    () => ({ users: [] }),
  ],
});
```

If an action returns a value, Arbor selects a renderer based on the Content-Type.
If an action throws, Arbor selects the best matching error handler.

## autoHead

By default, Arbor handles HEAD requests by falling back to a matching GET route.

```ts
createRoute({
  method: "GET",
  url: "/files",
  autoHead: false,
  actions: [
    () => "Disabled HEAD fallback",
  ],
});
```

Set `autoHead` to false if missing HEAD definitions should 404.

## Duplicate Route Detection

Arbor compares all routes when the application starts. If two routes resolve to the same method and final URL pattern, Arbor issues a warning through the logger.

Duplicates do not crash the application, but they are almost always unintentional.

## Combining Routes with Branches

Routes inside branches inherit the branch URL prefix and shared actions.

```ts
import { createApp, createBranch, createRoute } from "@kequtech/arbor";

const branchApi = createBranch({
  url: "/api",
  actions: [actionSetJson],
  routes: [
    {
      method: "GET",
      url: "/info",
      actions: [
        () => ({ version: "1.0" }),
      ],
    },
  ],
});

export default createApp({
  branches: [branchApi],
});
```

Request flow for `/api/info`:

1. branchApi actions
2. route actions
3. renderer or error handler

## Summary

A route defines:

* the HTTP method
* the URL pattern
* the ordered list of actions

Routes are the leaf nodes of Arbor’s structure. Branches define behavior by section; routes define behavior at specific endpoints.

Routes do not perform flow control beyond executing actions. All higher-level structure is determined by the branch tree and the action sequence.
