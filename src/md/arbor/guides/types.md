---
title: "Types"
description: "How Arbor uses TypeScript and where type hints actually help."
order: 6
---

# Types

Arbor is a runtime-first framework. TypeScript is used to **document intent**, this page highlights the few places where types meaningfully improve your experience.

## Action Type Hints

Actions are the primary place where type hints add real value.

### Context hints

`context` is always a `Record<string, unknown>` at runtime, but you can describe what your action expects:

```ts
interface ContextAuth {
  user?: { id: string };
}

export default createAction<ContextAuth>(({ context }) => {
  if (!context.user) throw Ex.Unauthorized();
});
````

This does not enforce correctness across branches, but it:

* gives you typed access inside the action
* documents assumptions clearly
* breaks when you refactor context structures

Recommended pattern:
Define small context interfaces (`ContextAuth`, `ContextRequestId`, etc.) in `src/lib/*` and import them into actions that depend on them.

### Return type hints

You can also hint at what an action returns:

```ts
interface PayloadStatus {
  status: "ok" | "error";
}

export default createAction((): PayloadStatus => ({ status: "ok" }));
```

Arbor routes the return value by content type at runtime, but the hint:

* documents intent
* protects you during refactors

## Typed Body Parsing

`getBody<T>()` returns a value typed as `T` after Arbor normalizes and validates inputs:

```ts
interface Body {
  email: string;
  age?: number;
}

const body = await getBody<Body>({
  trim: true,
  numbers: ["age"],
  required: ["email"],
});
```

With `throws: false`, the return type becomes a discriminated union so you can handle invalid bodies manually:

```ts
const result = await getBody<Body>({ throws: false });

if (!result.ok) return { errors: result.errors };
```

You do *not* need to understand every overload just supply `<T>` for structure.

## What Stays Intentionally Untyped

Some parts of Arbor must remain loose:

* **Renderers:**
  Receive `payload: unknown`, because any action may return anything.
* **Context (global):**
  Arbor does not track a single application-wide context type.

These layers *must* be written defensively.

## Summary

* Use **context hints** for clarity inside actions.
* Use **return type hints** to document what your action emits.
* Use `getBody<T>()` to type request bodies.
* Treat renderers, error handlers, and global context as intentionally untyped.

Use it where it helps, and don’t fight it where it doesn’t.
