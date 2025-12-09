---
title: "Body"
description: "How Arbor parses request bodies, controls normalization and handles multipart and raw data."
order: 5
---

# Body

Arbor does not parse the request body until an action calls `getBody`. This keeps requests fast when the body is not needed. When used, `getBody` can return structured data, raw buffers or multipart depending on the options provided.

Arbor performs **normalization by default**. This means that unless you opt out, Arbor:

- returns arrays when named explicitly
- otherwise returns only the first value for every field  

Normalization avoids inconsistencies where a field sometimes appears as a string and sometimes as an array. If you want unmodified semantics where body is mostly untouched, use `skipNormalize`.

## Primary Options

These options determine the fundamental parsing mode of `getBody`.

### raw

Returns a single `Buffer` containing the entire request body after the request completes.

```ts
const actionUpload = createAction(async ({ getBody }) => {
  const data = await getBody({ raw: true });
  return { size: data.length };
});
````

Normalization is skipped when using raw buffers.

### multipart

Parses multipart form data. Returns `[body, files]`:

```ts
const actionUploadAvatar = createAction(async ({ getBody }) => {
  const [body, files] = await getBody({ multipart: true });
  return { name: body.name, fileCount: files.length };
});
```

`body` is normalized unless you specify `skipNormalize`.

If there are no files or the request simply wasn't multipart `files` is an empty array. Each file includes `headers`, `name`, `filename`, `contentType` and `data` as a buffer.

### raw + multipart

Combining the two returns **an array of parts**, each containing:

* headers
* data as `Buffer`

This mode is useful for some types of low-level custom processing.

```ts
const actionParts = createAction(async ({ getBody }) => {
  const parts = await getBody({ raw: true, multipart: true });
  return { count: parts.length };
});
```

### skipNormalize

Disables all normalization. Every repeated field becomes an array. This matches raw HTTP semantics but is often inconvenient.

```ts
const actionSkip = createAction(async ({ getBody }) => {
  const data = await getBody({ skipNormalize: true });
  return data;
});
```

Use this only when you need the exact low-level shape of the incoming data.

## Normalization Options

These options modify the normalized body, they apply only when `raw` and `skipNormalize` are not used.

### arrays

Explicitly marks fields that are returned as arrays.

```ts
const actionPets = createAction(async ({ getBody }) => {
  const body = await getBody({
    arrays: ["ownedPets"],
  });
  return body;
});
```

Without this option, Arbor returns the first value.

### required

Marks fields that must be present. Missing fields produce a 422 error.

```ts
const actionRegister = createAction(async ({ getBody }) => {
  const body = await getBody({
    required: ["email", "password"],
  });
  return body;
});
```

This guarantees the key exists but does not guarantee the value is non-empty.

### numbers

Converts fields into numbers. Invalid numbers produce a 422 error.

```ts
const actionAge = createAction(async ({ getBody }) => {
  const body = await getBody({
    numbers: ["age"],
  });
  return { age: body.age };
});
```

### booleans

Converts fields into booleans. `"0"` and `"false"` become `false`. All other values become their truthy value.

```ts
const actionFlags = createAction(async ({ getBody }) => {
  const body = await getBody({
    booleans: ["active"],
  });
  return { active: body.active };
});
```

#### Mixing booleans and numbers

If a field is listed in both options:

1. Arbor converts the value to a number.
2. Then it converts the number to a boolean.

This is usually not intended. Avoid combining them.

### trim

Trims whitespace from all string values. Empty strings become `undefined`.

```ts
const actionTrim = createAction(async ({ getBody }) => {
  const body = await getBody({ trim: true });
  return { name: body.name };
});
```

Useful for forms and user input. This will also affect fields marked required, in that empty strings would no longer be valid.

## Validation

Use the `validate` object to enforce field-level constraints. Each key corresponds to a field name. Validators receive the normalized value.

Validators should return a **short lowercase string** describing the failure or undefined. Returning a string produces 422.

```ts
interface Body {
  name: string;
  age: number;
}

const actionValidate = createAction(async ({ getBody }) => {
  const body = await getBody<Body>({
    required: ["name", "age"],
    numbers: ["age"],
    validate: {
      name: value => {
        if (value.length < 3) return "too short";
      },
      age: value => {
        if (value < 0) return "invalid";
      },
    },
  });

  return body;
});
```

Validation occurs after all other normalization steps.

## Non Throwing Mode

`throws: false` allows you to receive validation or parsing errors without producing 422. Arbor returns `{ ok: false, errors }` or `{ ok true, data }`.

```ts
interface Body {
  email: string;
  name?: string;
}

const actionSafe = createAction(async ({ getBody }) => {
  const result = await getBody<Body>({
    required: ["email"],
    trim: true,
    throws: false,
  });

  if (!result.ok) {
    return { errors: result.errors };
  }

  return result.body;
});
```

Result might look like the following when there are errors:

```ts
{
  ok: false,
  errors: {
    email: 'is required',
  },
}
```

Useful for user-facing endpoints that need structured client errors.

## Compression

Arbor supports `br`, `gzip` and `deflate` when the request includes a `Content-Encoding` header. Decompression happens automatically before body parsing.

No configuration is required.

## Summary

`getBody` is explicit by design. Its behavior is controlled by:

* primary modes: `raw`, `multipart`, `skipNormalize`
* normalization tools: `arrays`, `required`, `numbers`, `booleans`, `trim`
* validation tools: `validate`, `throws`

Arbor never guesses intent. You specify the shape and strictness of incoming data, and Arbor enforces it predictably.
