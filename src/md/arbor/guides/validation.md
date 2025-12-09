---
title: "Validation"
description: "Patterns for validating request bodies, params and queries in Arbor."
order: 3
---

# Validation

Arbor does not ship with a full schema system, but `getBody` and actions make it straightforward to enforce input constraints. This guide focuses on a simple, composable pattern:

- normalize first  
- validate per field  
- fail early with clear errors  

## Body validation with getBody

`getBody` supports a `validate` object. Each key maps to a validator for that field. Validators run after normalization.

Validators should return a short lowercase string for failures or nothing for success.

```ts
interface Body {
  email: string;
  name: string;
  age?: number;
}

const actionCreateUser = createAction(async ({ getBody }) => {
  const body = await getBody<Body>({
    trim: true,
    required: ["email", "name"],
    numbers: ["age"],
    validate: {
      email: value => {
        if (!value.includes("@")) return "invalid";
      },
      name: value => {
        if (value.length < 3) return "too short";
      },
      age: value => {
        if (value < 0 || value > 150) return "out of range";
      },
    },
  });

  return body;
});
````

In this example the age validator does not run if the age field is missing, since it's optional. If any validation function returns a string, Arbor produces a 422.

## Non-throwing validation

For endpoints that need to return structured error responses, use `throws: false`.

```ts
const actionCreateUserSafe = createAction(async ({ getBody }) => {
  const result = await getBody({
    trim: true,
    required: ["email"],
    validate: {
      email: value => {
        if (!value.includes("@")) return "invalid";
      },
    },
    throws: false,
  });

  if (!result.ok) {
    return {
      errors: result.errors,
    };
  }

  return result.body;
});
```

This pattern is suitable for form endpoints where the client expects field-level error feedback.

## Shared validators

You can centralize common checks in a separate module and reuse them across actions.

```ts
// validators.ts
export const validateEmail = (value: string) => {
  if (!value.includes("@")) return "invalid";
};
```

Then combine them inside actions:

```ts
const actionRegister = createAction(async ({ getBody }) => {
  const body = await getBody({
    trim: true,
    required: ["email", "password"],
    validate: {
      email: validateEmail,
      password: value => {
        if (value.length < 8) return "too short";
      },
    },
  });

  return body;
});
```

## Params and query validation

Params and query strings are not handled by `getBody`. They are always strings and must be validated directly inside actions.

```ts
const actionGetUser = createAction(({ params }) => {
  const id = params.userId;
  if (!/^[0-9]+$/.test(id)) {
    throw Ex.BadRequest("Invalid id");
  }

  return { id: Number(id) };
});
```

For query strings:

```ts
const actionListUsers = createAction(({ url }) => {
  const pageRaw = url.searchParams.get("page") ?? "1";
  const page = Number(pageRaw);

  if (!Number.isInteger(page) || page < 1) {
    throw Ex.BadRequest("Invalid page");
  }

  return { page };
});
```

The pattern is the same: normalize, validate, throw `Ex.BadRequest` or use any error as needed.

## Splitting validation into its own function

If you're concerned about the size of a `getBody` definition, you can separate body validation into it's own function.

```ts
import { type GetBody, createAction } from "@kequtech/arbor";

interface CreateUserBody {
  email: string;
  name: string;
  age?: number;
}

async function getCreateUserBody(getBody: GetBody) {
  return await getBody<CreateUserBody>({
    trim: true,
    required: ["email", "name"],
    numbers: ["age"],
    validate: {
      email: value => {
        if (!value.includes("@")) return "invalid";
      },
    },
  });
}

const actionCreateUser = createAction(async ({ getBody }) => {
  const body = await getCreateUserBody(getBody);
  return { created: body.email };
});
```

This keeps validation logic contained and allows reuse across similar routes.

## Error representation

How validation failures are serialized is determined by your error handlers. For example, you can map 422 errors to a stable JSON schema that your frontend understands.

```ts
const errorHandlerJson = createErrorHandler({
  contentType: "application/json",
  action: ex => {
    return {
      error: ex.message,
      status: ex.statusCode,
    };
  },
});
```

Validation code should focus on deciding whether input is acceptable. Formatting validation errors is the job of error handlers and renderers.

## Summary

Validation in Arbor is built from a few simple pieces:

* Body normalization and field-level validators via `getBody`
* Direct checks for params and query strings inside actions
* Explicit error throwing for invalid input
* Optional non-throwing mode when you need structured error responses

The framework stays out of the way. You decide how strict each endpoint is and how failures are reported.
