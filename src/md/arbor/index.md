---
title: "Home"
description: "A minimal, modular Node.js framework for building fast and predictable web applications."
order: 1
---

# <img class="m-0!" src="/assets/images/arbor-logo-600.png" alt="Arbor" width="300">

Arbor is a lightweight, dependency-free Node.js framework that gives you full control over how requests move through your application. It exposes the native HTTP primitives and adds a clear, modular structure that scales from small services to large systems.

## Why Arbor

Arbor favors explicit behavior and predictable flow. It avoids global middleware layers, hidden abstractions, or auto parsing. You always know what runs and when.

Key properties:

- Deterministic sequences of actions for each route
- Modular branching that mirrors real project structures
- Zero dependencies and minimal overhead
- Explicit handling of Content-Type for rendering and error behavior
- Flexible body parsing with validation, type enforcement, multipart support and controlled failure modes
- Accurate CORS and OPTIONS handling based on the actual route map
- Built in testing through the inject tool

Arbor is suited to engineers who want precision in HTTP behavior and a framework that does not make assumptions about project design.

## Quick Start

Install:

```bash
npm i @kequtech/arbor
````

A minimal application:

```ts
// server.js
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
      actions: [() => "Hello world!"],
    },
  ],
});
```

## Documentation structure

The documentation is organized into two main areas.

### Core

Fundamental concepts. Branches, routes, actions, rendering, error handling, body parsing and static files.

### Guides

Practical patterns for authentication, validation, testing and structuring larger applications.

## Where to go next

Start with Getting Started, then explore Core. If you already understand the basics, jump directly to Actions, Branches or Body to see how the framework operates in detail.
