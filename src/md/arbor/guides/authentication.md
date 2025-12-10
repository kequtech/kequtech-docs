---
title: "Authentication"
description: "Patterns for implementing authentication and authorization in Arbor using actions and branches."
order: 1
---

# Authentication

Arbor does not ship with a built-in authentication system. Instead, it provides primitives that make it easy to plug in your own approach. Typical patterns are:

- header-based tokens  
- cookies and sessions  
- per-branch guards and per-route overrides  

This guide shows how to structure these concerns using branches and actions.

## Header-based token example

A common pattern is to read a bearer token from the Authorization header and store the user in `context`.

```ts
import { createAction, createRoute, createBranch, Ex } from "@kequtech/arbor";

const actionAuthRequired = createAction(async ({ req, context }) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw Ex.Unauthorized("Missing token");
  }

  const token = header.slice("Bearer ".length).trim();

  // Look up the user. Real code would hit a database or cache.
  const user = await findUserByToken(token);
  if (!user) {
    throw Ex.Unauthorized("Invalid token");
  }

  context.user = user;
});
```

Then read that user in downstream actions:

```ts
interface ContextUser {
  user?: User;
}

const actionCurrentUser = createAction<ContextUser>(({ context }) => {
  if (!context.user) throw Ex.InternalServerError("Missing user");

  // Sends the authenticated user directly to the renderer.
  return context.user;
});

const routeMe = createRoute({
  method: "GET",
  url: "/me",
  actions: [
    actionAuthRequired,
    actionCurrentUser,
  ],
});
````

Key points:

* `context` is considered unknown; actions should always assert what it expects to contain
* authentication is just an action that can be reused across many routes
* unauthorized access throws `Ex.Unauthorized`, which invokes an error handler

## Branch-level guards

It is often useful to guard an entire branch.

```ts
const branchApiSecure = createBranch({
  url: "/api",
  actions: [
    actionAuthRequired,
  ],
  routes: [
    routeMe,
    // Other secure routes, all share the same auth requirement
  ],
});
```

All routes inside `branchApiSecure` require authentication. Public routes can live in a different branch. This structure keeps access policies clear and visible.

## Cookie-based authentication

If you use cookies for sessions, the pattern is similar. Use the cookies helper and still store the user in `context`.

```ts
const actionSessionAuth = createAction(async ({ cookies, context }) => {
  const sessionId = cookies.get("session");
  if (!sessionId) {
    throw Ex.Unauthorized("Missing session");
  }

  const session = await findSession(sessionId);
  if (!session) {
    throw Ex.Unauthorized("Invalid session");
  }

  context.user = session.user;
});
```

Combine it at the branch level the same way as header-based auth.

## Optional authentication

Sometimes routes should behave differently depending on whether a user is authenticated, without rejecting anonymous requests. In that case, do not throw if auth fails. Set a flag on context instead.

```ts
const actionTryAuth = createAction(async ({ req, context }) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return;

  const token = header.slice("Bearer ".length).trim();
  const user = await findUserByToken(token); // User | undefined

  context.user = user;
});

const actionMaybePersonalized = createAction<ContextUser>(({ context }) => {
  if (!context.user) {
    return { message: "hello, guest" };
  }
  return { message: `hello, ${context.user.email}` };
});

const routeGreeting = createRoute({
  method: "GET",
  url: "/greeting",
  actions: [
    actionTryAuth,
    actionMaybePersonalized,
  ],
});
```

This pattern is useful for home pages, dashboards and other mixed-access endpoints.

## Role-based authorization

Once authentication is in place, authorization is just another action that inspects `context.user`.

```ts
const actionRequireAdmin = createAction<ContextUser>(({ context }) => {
  if (context.user?.role !== "admin") {
    throw Ex.Forbidden("Insufficient permissions");
  }
});

const routeAdminStats = createRoute({
  method: "GET",
  url: "/admin/stats",
  actions: [
    actionTryAuth,
    actionRequireAdmin,
    () => ({ users: 42 }),
  ],
});
```

You can create small, composable actions like `actionRequireRole("editor")` that return new actions for specific roles or scopes.

## Error handling and tokens

Authentication and authorization failures typically map to:

* `401 Unauthorized` for missing or invalid credentials
* `403 Forbidden` for insufficient permissions

How these are presented to clients is defined by your error handlers and renderers. Arbor does not enforce any specific error schema.

## Summary

Authentication in Arbor is built from small actions:

* one action to authenticate
* optional actions to enforce roles or scopes
* branches to separate public and private sections
* context to share the user across the request

This keeps authorization logic explicit, testable and easy to reason about as your application grows.
