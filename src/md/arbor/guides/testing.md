---
title: "Testing"
description: "Testing Arbor applications with inject and createTestBundle."
order: 5
---

# Testing

Arbor provides two testing helpers:

- `inject` for end-to-end tests against a full app  
- `createTestBundle` for direct action tests without routing

Both use the same internal machinery as the router, so tests behave like real requests.

## Integration tests with inject

`inject` simulates a full HTTP request against an Arbor app without starting a server.

```ts
import { inject } from "@kequtech/arbor";
import app from "../src/app.ts";

test("GET /admin/dashboard reads the authorization header", async () => {
  const { getResponse, res } = inject(app, {
    method: "GET",
    url: "/admin/dashboard",
    headers: {
      authorization: "mike",
    },
  });

  const body = await getResponse();

  expect(res.getHeader("Content-Type")).toBe("text/plain");
  expect(body).toBe("Hello admin mike!");
});
````

### Request options

`inject(app, options)` accepts the same `ReqOptions` Arbor uses internally:

* `method?: string`
* `url?: string`
* `headers?: Record<string, string>`
* `rawHeaders?: string[]`
* `body?: unknown`

Example for JSON:

```ts
const { getResponse } = inject(app, {
  method: "POST",
  url: "/users",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({ name: "April" }),
});
```

`inject` always finalizes the request automatically unless you pass `body: null`, doing so you can write manually using `req` for more fine grained testing control.

```ts
const { req, getResponse } = inject(app, {
  method: "POST",
  url: "/users",
  headers: {
    "content-type": "application/json",
  },
  body: null,
});

req.end(JSON.stringify({ name: "April" }));
```

### getResponse

`getResponse` waits until the response is complete and then returns the body:

* `application/json` → parsed JSON
* `text/*` → string
* anything else → `Buffer`

```ts
const { getResponse, res } = inject(app, {
  method: "GET",
  url: "/info",
});

const body = await getResponse();

expect(res.statusCode).toBe(200);
expect(typeof body).toBe("object");
```

To always get a `Buffer`, use `{ raw: true }`:

```ts
const data = await getResponse({ raw: true });
```

`req` and `res` are fake HTTP objects that behave like the real ones for testing.

## Direct action tests with createTestBundle

For smaller tests you often do not want to involve routing or the full app. Instead, you can call an action directly with a test bundle.

Arbor exposes `createTestBundle` for this purpose.

```ts
import { createTestBundle } from "@kequtech/arbor/testing";
import actionUsers from "../src/app/api/users/action.ts";

test("users list returns payload", async () => {
  const bundle = createTestBundle();
  const result = await actionUsers(bundle);

  expect(result).toEqual([{ id: 1, name: "User" }]);
});
```

### TestBundleOptions

`createTestBundle` accepts `TestBundleOptions`, which extends `ReqOptions` and adds:

* `params?: Record<string, string>`
* `context?: BundleContext`

Example with params and context:

```ts
const bundle = createTestBundle({
  params: {
    userId: "123",
  },
  context: {
    requestId: "abc",
  },
});
```

This produces the same `Bundle` object that `inject` would pass to the action:

* `req` and `res`
* `url` default `/` not necessarily used by all actions
* `context` default `{}`
* `params` default `{}`
* `methods` default `[method]`
* `cookies` and `getBody` wired up correctly

### Testing POST actions with getBody

Because `createTestBundle` uses the same `getBody` as real requests, you can test body parsing logic directly.

```ts
import { createTestBundle } from "@kequtech/arbor/testing";
import actionUsersCreate from "../src/app/api/users/create/action.ts";

test("create user parses body and returns response", async () => {
  const bundle = createTestBundle({
    method: "POST",
    url: "/api/users",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name: "April" }),
  });

  const result = await actionUsersCreate(bundle);

  expect(result).toEqual({ created: "April" });
});
```

If your action relies on `context`, you can pre-populate it:

```ts
const bundle = createTestBundle({
  method: "GET",
  url: "/profile",
  context: {
    user: { id: "123", email: "user@example.com" },
  },
});

const result = await actionProfile(bundle);
```

## When to use which

* Use **`inject`** when you want to test routing, branching, error handlers, renderers and other end-to-end behavior.
* Use **`createTestBundle`** when you want fast, focused tests for a single action.

Both tools are built on the same primitives as the runtime router, so you do not need a separate testing layer or spin up times.

## Summary

Arbor's testing support is small but effective:

* `inject` simulates full HTTP traffic without a real server
* `createTestBundle` builds a realistic `Bundle` so you can call actions directly
* These reuse simulated req, simulated res, cookies and getBody internally

This keeps tests close to production behavior while remaining fast and easy to write as unit tests.
