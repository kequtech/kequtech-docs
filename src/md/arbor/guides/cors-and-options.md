---
title: "Cors and Options"
description: "How Arbor handles CORS headers and preflight requests."
order: 4
---

# Cors and Options

Arbor does not hide CORS behind configuration files or magic flags. CORS is controlled by headers that you set in actions. The framework adds a few defaults when it sees an `OPTIONS` route so preflight requests are easy to support.

## Default CORS behavior

To enable basic CORS, you must define at least one `OPTIONS` route. The simplest form is a wildcard route:

```ts
createApp({
  routes: [
    {
      method: "OPTIONS",
      url: "/**",
    },
  ],
});
````

When a request hits an `OPTIONS` route, Arbor automatically:

* sets `statusCode` to `204`
* sets `Content-Length` to `0`
* sets `Access-Control-Allow-Origin: *`
* sets `Access-Control-Allow-Methods` and `Valid` to the list of methods available at the requested URL
* sets `Access-Control-Allow-Headers` to echo the headers requested by the client (`Access-Control-Request-Headers`)

This is enough to handle the majority of CORS use cases, especially for APIs that are happy with `*` as the origin. If you need more control, you attach actions to the `OPTIONS` route.

## Customizing OPTIONS responses

You can add headers or tweak behavior by defining actions on the `OPTIONS` route.

```ts
const actionCorsOptions = createAction(({ res }) => {
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Access-Control-Request-Headers");
});

createApp({
  routes: [
    {
      method: "OPTIONS",
      url: "/**",
      actions: [
        actionCorsOptions,
      ],
    },
  ],
});
```

As `OPTIONS` responses do not need a body, you can leave the route without a renderer. Arbor’s default 204 + headers behavior is enough.

## Restricting Access-Control-Allow-Origin

By default, Arbor sets `Access-Control-Allow-Origin: *` on all routes that have a matching `OPTIONS` route. If you want to restrict origins, the simplest place to do that is a global action on the app.

The `methods` array in the bundle contains the allowed methods for the current request. You can use it to only set CORS headers on URLs that are using `OPTIONS`.

```ts
const actionStrictCors = createAction(({ res, methods }) => {
  if (methods.includes("OPTIONS")) {
    res.setHeader("Access-Control-Allow-Origin", "https://foo.com");
  }
});

createApp({
  actions: [
    actionStrictCors,
  ],
  routes: [
    {
      method: "OPTIONS",
      url: "/**",
    },
  ],
});
```

This pattern:

* ensures all responses at CORS-enabled URLs use a strict `Access-Control-Allow-Origin`
* lets you change the origin logic in one place
* still relies on `OPTIONS` routes for preflight handling

If there is no `OPTIONS` route for a URL, `methods` will not include `"OPTIONS"` and no CORS header is added.

## Per-branch or per-route CORS

You do not have to manage CORS globally. You can attach actions at the branch or route level to apply different policies to different parts of your application.

```ts
const actionCorsPublic = createAction(({ res, methods }) => {
  if (methods.includes("OPTIONS")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
});

const branchApiPublic = createBranch({
  url: "/api/public",
  actions: [
    actionCorsPublic,
  ],
});
```

And for a private admin section:

```ts
const actionCorsAdmin = createAction(({ res, methods }) => {
  if (methods.includes("OPTIONS")) {
    res.setHeader("Access-Control-Allow-Origin", "https://admin.example.com");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
});
```

Arbor does not enforce any single pattern. It just provides the `methods` array and a predictable `OPTIONS` behavior.

## Summary

CORS in Arbor is straightforward:

* You declare `OPTIONS` routes to support preflight requests.
* Arbor automatically:

  * responds with 204
  * sets `Content-Length: 0`
  * sets `Access-Control-Allow-Origin: *`
  * sets `Access-Control-Allow-Methods` and `Valid` accurately
  * sets `Access-Control-Allow-Headers` sensibly
* You customize behavior with actions:

  * change `Access-Control-Allow-Origin`
  * set `Access-Control-Max-Age`, `Vary`, or credentials headers
  * apply different rules globally, per branch, or per route

For the full details on what browsers expect from CORS responses, refer to the <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">MDN CORS documentation</a>. Arbor’s job is just to make setting those headers easy.
