---
title: "Renderers"
description: "How Arbor finalizes responses based on Content-Type."
order: 6
---

# Renderers

Renderers finalize responses in Arbor. When an action returns a value, Arbor selects a renderer whose `contentType` matches the current response Content-Type. The renderer receives the returned value and the request bundle, then writes the response.

If no renderer matches, Arbor uses the built-in fallback for JSON or text.

## Creating a Renderer

```ts
import { createRenderer } from "@kequtech/arbor";

const rendererHtml = createRenderer({
  contentType: "text/html",
  action: (payload, { req, res }) => {
    const html = `<p>${payload}</p>`;

    res.setHeader("Content-Length", Buffer.byteLength(html));
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(html);
  },
});
````

A renderer receives:

```ts
(payload: unknown, bundle: Bundle) => void
```

Returned values are ignored, renderers must finalize the response.

## Matching Content Types

Arbor matches renderers using simple pattern logic:

* `"application/json"` matches `"application/json"`
* `"text/*"` matches `"text/plain"`, `"text/html"`, etc.

Use specific content types for precise control or wildcards for broad formats.

## Attaching Renderers to Branches

Renderers belong to branches. A renderer affects all routes inside that branch and its nested branches.

```ts
import { createBranch } from "@kequtech/arbor";

const branchDocs = createBranch({
  url: "/docs",
  renderers: [
    rendererHtml,
  ],
});
```

Routes inside `/docs` will use `rendererHtml` unless another renderer is closer or more specific.

## Built-in Renderers

Arbor ships with two renderers:

* `application/json`
* `text/*`

These handle most cases. You override them by providing renderers with the same contentType.

## Example: JSON Renderer Override

```ts
const rendererPrettyJson = createRenderer({
  contentType: "application/json",
  action: (payload, { req, res }) => {
    const json = JSON.stringify(payload, null, 2);

    res.setHeader("Content-Length", Buffer.byteLength(json));
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(json);
  },
});
```

## HEAD Behavior

Renderers are responsible for correct HEAD handling. The standard pattern:

```ts
if (req.method === "HEAD") {
  res.end();
  return;
}
```

## Interaction with Actions

An action can:

* return a value to invoke a renderer
* throw an error to invoke an error handler
* finalize the response directly and prevent renderers from running

Renderers always run after an action returns a value.

## Renderer Location

Best practice is to define renderers in a dedicated module and reference them inside branches. This keeps route files small and avoids duplication.

```ts
// renderers.ts
export const rendererHtml = createRenderer({ ... });
export const rendererJson = createRenderer({ ... });
```

Then:

```ts
const branchDocs = createBranch({
  url: "/docs",
  renderers: [rendererHtml],
});
```

## Summary

Renderers convert returned values into final responses. Key points:

* They match on Content-Type
* They finalize the response
* They belong to branches
* They handle GET and HEAD explicitly
* They allow each part of the app to define its own output format

Renderers are one of Arbor’s core extension points and make it possible to support any response format you need.
