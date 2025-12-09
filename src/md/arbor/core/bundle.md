---
title: "Request Bundle"
description: "The immutable object Arbor passes to every action."
order: 4
---

# Request Bundle

Every action in Arbor receives a single argument: the request bundle. It is an immutable object that collects everything your action needs to handle a request.

```ts
interface Bundle {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  context: Record<string, unknown>;
  params: Record<string, string>;
  methods: string[];
  cookies: Cookies;
  getBody: GetBody;
}
````

The router builds this bundle once per request and freezes it before passing it through your actions.

## req and res

`req` and `res` are the standard Node HTTP objects.

```ts
const actionLog = createAction(({ req, res }) => {
  console.log(req.method, req.url);
  res.setHeader("X-Request-Id", "abc");
});
```

Arbor does not wrap or replace them. Anything that works with Node’s `IncomingMessage` and `ServerResponse` works here.

## url

`url` is a `URL` instance constructed from the request URL and the `protocol` and `host` headers.

```ts
const actionQuery = createAction(({ url }) => {
  const page = url.searchParams.get("page") ?? "1";
  return { page: Number(page) };
});
```

This is the recommended way to read query strings.

## context

`context` is a plain object scoped to the request.

```ts
context: Record<string, unknown>;
```

Best practice is:

* assign freely
* assert when reading

```ts
const actionAuth = createAction(({ context }) => {
  context.user = { id: "123" };
});

const actionProfile = createAction(({ context }) => {
  const user = context.user as User | undefined;
  if (!user) throw Ex.InternalServerError("Missing user");
  return user;
});
```

Every request gets a fresh context object.

## params

`params` contains route parameters and wildcard segments, all as strings.

```ts
const actionUser = createAction(({ params }) => {
  const id = params.userId;
  return { id };
});
```

Arbor does not coerce parameter types. Use `Number(...)` or custom parsing when needed. For wildcard routes (`/**`), Arbor uses a `wild` parameter.

```ts
const actionStatic = createAction(({ params }) => {
  const path = params.wild;
  // "/some/path/here"
});
```

## methods

`methods` is the list of allowed HTTP methods for this route, including auto-generated ones such as HEAD when `autoHead` is enabled.

You can use it when constructing responses like `Allow` headers or OPTIONS responses.

```ts
const actionOptions = createAction(({ methods }) => {
  return {
    allow: methods,
  };
});
```

In most actions you will not need `methods`, but it is available when you do.

## cookies

`cookies` is a helper over request and response cookies.

```ts
const actionTrack = createAction(({ cookies }) => {
  const visit = cookies.get("visit") ?? "0";
  const count = Number(visit) + 1;

  cookies.set("visit", String(count), { maxAge: 3600 });
});
```

Reads return `string | undefined`. Writes accept only strings. Removing a cookie is done by calling `cookies.remove`, it will set it to an empty string with `Max-Age=0`.

## getBody

`getBody` parses the request body on demand. It is covered in detail in the Body section. At a high level:

* it reads the request stream
* normalizes fields unless `skipNormalize` is used
* supports JSON, urlencoded, multipart and raw buffers
* enforces required fields, arrays, numbers, booleans and validators when configured

Typical usage:

```ts
const actionCreate = createAction(async ({ getBody }) => {
  const body = await getBody({
    trim: true,
    required: ["name"],
  });

  return { created: body.name };
});
```

## Immutability

The bundle object itself is frozen:

```ts
Object.freeze({
  req,
  res,
  url,
  context,
  params,
  methods,
  cookies,
  getBody,
});
```

You can:

* mutate `res` (headers, status, body)
* mutate `context`
* read everything else

You cannot replace top-level properties on the bundle.

## Testing with Bundles

`createTestBundle` builds the same structure for tests.

```ts
import { createTestBundle } from "@kequtech/arbor/testing";
import actionExample from "../src/app/example/action.ts";

test("actionExample works", async () => {
  const bundle = createTestBundle({
    method: "GET",
    url: "/example",
  });

  const result = await actionExample(bundle);

  expect(result).toEqual({ ok: true });
});
```

This makes it possible to test actions directly without routing.

## Summary

The bundle is the core execution context for every request. It contains:

* raw Node objects (`req`, `res`)
* high-level helpers (`url`, `cookies`, `getBody`)
* request-scoped `context`
* routing data (`params`, `methods`)

If you understand the bundle, you understand how Arbor sees each request.
