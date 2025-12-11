---
title: "Actions"
description: "Actions are the execution units of Arbor. They run in order and decide how each request is processed."
order: 3
---

# Actions

Actions are the smallest unit of behavior in Arbor. A route is a list of actions. Arbor runs them in order until one of them:

- returns a value  
- throws an error  
- finalizes the response  

All routing, body parsing, cookies, context and helpers are provided through the **Bundle**, which is covered in detail in the Request Bundle section.

Actions run sequentially. Arbor executes them in the order it discovers them:  

> application-level actions → branch actions → route actions.

## Creating an Action

Use `createAction` to define an action. It receives the request bundle as its only argument.

```ts
import { createAction } from "@kequtech/arbor";

const actionSetHeader = createAction(({ res }) => {
  res.setHeader("X-Powered-By", "arbor");
});
````

Actions may be synchronous or asynchronous; Arbor awaits each one before continuing.

## Adding Actions to a Route

A route executes its actions in the order you provide them:

```ts
import { createRoute } from "@kequtech/arbor";

const routeStatus = createRoute({
  method: "GET",
  url: "/status",
  actions: [
    actionSetHeader,
    () => "OK",
  ],
});
```

The second action here returns a value. Arbor selects a renderer and finalizes the response, skipping all remaining actions.

## Returning a Value

Returning any non-undefined value ends the action chain:

```ts
const actionReply = createAction(() => {
  return { status: "ready" };
});
```

Once an action returns a value:

1. Arbor selects a renderer based on the current `Content-Type`
2. The renderer formats the value
3. The response is finalized
4. No further actions run

Returning `undefined` means “continue to the next action”.

## Throwing an Error

Throwing stops the chain immediately.

```ts
const actionCheck = createAction(() => {
  throw Ex.BadRequest("Invalid");
});
```

Arbor chooses an error handler based on the current `Content-Type` and formats the error accordingly. All thrown errors are normalized to `ServerEx` objects (see Errors section).

## Finalizing the Response

An action may manually finalize the response:

```ts
const actionRedirect = createAction(({ res }) => {
  res.statusCode = 302;
  res.setHeader("Location", "/login");
  res.end();
});
```

Calling `res.end()` stops the chain. No renderer or error handler is invoked afterward. Manual finalization is useful for redirects, file streaming, or custom protocols.

## Using the Request Bundle

See the **Request Bundle** page for the full description and best practices.

```ts
const actionAuth = createAction(({ req, context }) => {
  const token = req.headers.authorization;
  if (!token) {
    throw Ex.Unauthorized();
  }

  context.user = token;
});
```

Actions are encouraged to:

* modify `res`
* read request information
* store data in `context`
* parse the body using `getBody`
* enforce security and validation
* return data to invoke a renderer
* throw errors

## Types and Hints

Arbor does not try to statically type entire request pipelines. Actions, however, can use
TypeScript hints to make their assumptions explicit.

Two forms of hints are supported:

- context hints  
- return type hints  

These hints improve local clarity inside actions without changing Arbor’s runtime model.

```ts
// context hint
export default createAction<Context>(({ context }) => {
  // context is typed
});
````

```ts
// return type hint
export default createAction((): Payload => ({ status: "ok" }));
```

For a more complete explanation of these patterns and when to use them, see
**Types**.

## Summary

Actions form a clear, predictable execution model:

* run in order
* return → render and stop
* throw → error handler and stop
* finalize → stop
* otherwise → continue

Together, actions and routes define how each request in an Arbor application behaves.
