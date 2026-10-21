# Local Mart Admin

The admin web app for Local Mart. It calls localMart-BE's admin API directly. Built with Vite, React 19 and TypeScript, using Redux Toolkit (RTK Query) for server data, React Router 7 (`react-router-dom`) for pages, Tailwind CSS 4 with shadcn/ui (base-nova style on Base UI), and lucide-react icons.

## Run it

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # tsc -b && vite build -> dist/
npm run lint     # oxlint
```

From the workspace root, `npm run dev` (or `npm run dev:web`) starts it together with the gateway and localMart-BE.

In dev, Vite proxies `/api` to the Nginx gateway on `http://localhost:8000`, which sends these paths to localMart-BE. The gateway and localMart-BE must be running. The port is pinned to 5174 because localMart-BE's CORS allowlist (`src/config/allowOrigins.ts`) names that origin. Set `VITE_API_URL` to call another API base; the default is `/api` on the same origin.

Sign in with a localMart-BE admin account. `npm run db:seed` in localMart-BE creates them from its `SEED_*` variables.

Routes are client-side (`/login`, `/`, and so on), so whatever serves `dist/` in production must answer unknown paths with `index.html`.

## Theme

One dark theme, set as CSS variables in `src/index.css` (`:root`), with `class="dark"` on `<html>` so shadcn's dark styles apply:

- Page background `#000000`, text `#F5EBDD`.
- Cards `#315B8C` (`card`), outlined in coral `#F2765E` (`card-border`, used by `src/components/ui/card.tsx`).
- Coral `#F2765E` (`primary`): main actions and the brand. Buttons on it use dark text, because cream on coral is too faint.
- Blue `#315B8C` (`secondary`, `sidebar-accent`): the active sidebar item and secondary actions. Inside cards, `muted` and `accent` are a darker blue, and form fields have black edges (`input`).
- Muted text, links (`text-link`) and the error colour are light tints that stay readable on both black and the blue cards (at least 4.5:1). Focus rings are cream, because coral on blue is too faint.
- The coral-to-blue gradient (`bg-linear-to-r from-primary to-secondary`) marks the brand and the top bar.

Use these tokens (`bg-card`, `text-muted-foreground`, …), not raw colours. A `secondary` badge or button inside a card is invisible (same blue), so use `outline` there.

## Layout

| Path | What |
| --- | --- |
| `src/api/base-api.ts` | The one RTK Query API (`adminApi`). It adds the bearer token, turns localMart-BE's error envelope into an `ApiError`, and signs out on a 401 |
| `src/api/*-api.ts` | Endpoints per feature, added with `adminApi.injectEndpoints`. Unwrap the `{ success, data }` envelope in `transformResponse` |
| `src/store/` | The store, the auth slice (token, kept in `localStorage` under `lm-admin-token`), and typed `useAppDispatch` / `useAppSelector` |
| `src/router.tsx` | Every route. Signed-in screens go under `RequireAuth` (which sends a visitor without a token to `/login` and back afterwards) and `AdminLayout` |
| `src/components/AdminLayout.tsx` | The header, the navigation (`NAV`) and sign-out around every signed-in page |
| `src/pages/` | Screens, one per sidebar entry (`DashboardPage`, `AddProductPage`, `ProductsPage`, `ApprovalsPage`, `PartnersPage` for merchants, drivers and farmers, `CultivationPage`), plus `LoginPage` and `NotFoundPage` |
| `src/components/ui/` | shadcn components. Add more with `npx shadcn@latest add <name>` |
