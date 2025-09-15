# Cooking Mama Recipe Generator Backend

A minimal REST API for recipes with email/password auth, JWT cookies, CSRF protection, and SQLite persistence for saved recipes. Built with Bun and Hono.

## Stack

- Bun 1.x (runtime, test runner, SQLite bindings)
- Hono (HTTP framework + JWT/CSRF middleware)
- SQLite (via `bun:sqlite`)
- Axios (fetch recipes from TheMealDB)

## Getting Started

1. Install dependencies

```
bun install
```

2. Configure environment

- Create a `.env` file at the repo root:

```
JWT_SECRET=your_dev_secret
NODE_ENV=development
```

Note: Bun loads `.env` automatically. The server will fail to start if `JWT_SECRET` is missing.

3. Run the server (hot reload)

```
bun run dev
```

Server listens on `http://localhost:3000` and creates `db.sqlite` automatically.

## Database

The schema is applied on boot:

- `users(id, email, password_hash)`
- `saved_recipes(user_id, recipe_id, created_at, UNIQUE(user_id, recipe_id))`

SQLite WAL mode is enabled. In development, you can delete `db.sqlite*` to reset the DB.

## API Overview

Public

- `GET /` → `{ status: "ok" }`
- `GET /recipes/random`
- `GET /recipes/:id`
- `GET /recipes/category/:category`
- `GET /recipes/area/:area`

Auth (cookie-based JWT; sets `authToken`)

- `POST /auth/signup` → body: `{ email, password }`
- `POST /auth/login` → body: `{ email, password }`
- `POST /auth/logout`
- `GET /auth/me`

Saved Recipes (authenticated; under `/auth` so JWT + CSRF apply)

- `GET /auth/saved-recipes` → `{ recipes: number[] }`
- `POST /auth/saved-recipes` → body: `{ recipeId: number }` → `{ ok: true }`
- `DELETE /auth/saved-recipes/:id` → `{ ok: true }`

Notes

- JWT is stored in an `httpOnly` cookie `authToken`.
- CSRF protection is enabled for unsafe methods under `/auth/*`. Your client must include the expected CSRF token header per `hono/csrf` usage.
- TheMealDB is used as the recipe source; responses are proxied without modification.

## Example (signup + save)

```
# signup
curl -i -X POST http://localhost:3000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"password123"}'

# use the Set-Cookie value from the response as $COOKIE
# save a recipe (include CSRF header if your client enforces it)
curl -i -X POST http://localhost:3000/auth/saved-recipes \
  -H 'Content-Type: application/json' \
  -H "Cookie: $COOKIE" \
  -d '{"recipeId":52772}'

# list saved recipes
curl -s http://localhost:3000/auth/saved-recipes \
  -H "Cookie: $COOKIE"
```

## Testing

Run the test suite:

```
bun test
```

## Project Structure

- `src/index.ts` — server setup, middleware, router mounts
- `src/routes/*.ts` — route handlers (`auth`, `recipes`, `savedRecipes`)
- `src/db/*` — SQLite connection, schema, and queries
- `src/services/mealdb.ts` — TheMealDB API calls
- `src/test/*` — Bun tests

## Development Notes

- Passwords are hashed with Bun’s password API.
- Duplicate saves are ignored (`INSERT OR IGNORE`).
- CORS is enabled for all routes.
