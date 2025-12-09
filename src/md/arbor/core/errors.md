---
title: "Errors"
description: "How Arbor handles thrown errors and how to define custom error responses."
order: 7
---

# Errors

When an action throws, Arbor converts whatever was thrown into a `ServerEx`. Error handlers always receive a `ServerEx`, even if the original value was a string, plain object or arbitrary exception.

If Arbor creates the error and no status code can be inferred, it defaults to **500**.

Arbor then selects an error handler based on the current `Content-Type`. Error handlers behave exactly like actions: they may return a value (which is then rendered) or finalize the response manually.

## Throwing Errors

Arbor provides the `Ex` helper to create structured server errors:

```ts
import { Ex } from "@kequtech/arbor";

const actionRequireAuth = createAction(() => {
  throw Ex.Unauthorized("Missing token");
});
````

`Ex` produces:

```ts
interface ServerEx extends Error {
  statusCode: number;
  info: Record<string, unknown>;
}
```

Typical constructors:

```ts
throw Ex.NotFound("no such item");
throw Ex.BadRequest("Invalid input", { cause: "format" });
throw Ex.StatusCode(451, "Restricted");
```

## Unknown to ServerEx

If you ever need to turn an unknown thrown value into `ServerEx`, use `unknownToEx`:

```ts
import { unknownToEx } from "@kequtech/arbor";

try {
  await someAsyncOperation();
} catch (error) {
  const ex = unknownToEx(error);
}
```

In most cases you don't need to, allowing the error to be thrown to Arbor is sufficient as it will do this automatically.

## Error Handler Basics

Create an error handler with `createErrorHandler`. It specifies the content type it expects and how to turn a `ServerEx` into a response value.

```ts
import { createErrorHandler } from "@kequtech/arbor";

const errorHandlerText = createErrorHandler({
  contentType: "text/*",
  action: (ex, { url }) => {
    return `${url.pathname} ${ex.statusCode} ${ex.message}`;
  },
});
```

Important details:

* The `ex` parameter is always `ServerEx`.
* If the action returns a value, Arbor passes it to the appropriate renderer for the content type on the response.
* If the action finalizes the response, nothing more runs.

## Attaching Error Handlers to Branches

Error handlers are defined on branches. A request uses error handlers from its branch and from any parent branches.

```ts
const branchDocs = createBranch({
  url: "/docs",
  errorHandlers: [
    errorHandlerText,
  ],
});
```

Matching follows the same specificity logic as renderers:

* `"application/json"` beats `"application/*"`
* `"text/html"` beats `"text/*"`

## Default Error Handler

If no matching handler exists, Arbor’s built-in error handler runs. It does the following:

* Sets Content-Type to `application/json`
* Strips metadata except for `cause`
* Includes `info` only in non-production environments
* Includes `stack` only in non-production environments

Shape:

```ts
interface ErrorResponse {
  statusCode: number;
  message: string;
  cause?: unknown;
  stack?: string[];
  info?: Record<string, unknown>;
}
```

Runtime behavior:

```ts
export const errorHandler = createErrorHandler({
  contentType: "*",
  action(ex, { res }) {
    const error: ErrorResponse = {
      statusCode: ex.statusCode,
      message: ex.message,
      cause: ex.cause,
    };

    if (process.env.NODE_ENV !== "production") {
      error.stack = ex.stack?.split(/\r?\n/);
      error.info = ex.info;
    }

    res.setHeader("Content-Type", "application/json");
    return { error };
  },
});
```

### Metadata rules

Given:

```ts
throw Ex.BadRequest("invalid", { cause: "foo", extra: "bar" });
```

Arbor produces:

* `ex.cause === "foo"`
* `ex.info === { extra: "bar" }`

The default handler sends:

* `cause` always
* `info` only in non-production environments

This keeps error responses safe while remaining useful during development.

## Throwing Inside of an Error Handler

If an error handler throws, Arbor treats it as a fatal exception:

* No further handlers are attempted
* Arbor sends an empty response body

Handlers should catch failures if stability is important.

## Summary

Key behaviors:

* Everything thrown becomes a `ServerEx`
* Error handlers receive `ServerEx`, not `unknown`
* Handlers belong to branches and follow specificity rules
* Handlers behave like regular actions
* Default handler outputs safe JSON, stripping metadata in production
* Throwing inside of a handler results in a fatal error

Error handlers give you control over how failures are represented, without affecting the structure of your application.
