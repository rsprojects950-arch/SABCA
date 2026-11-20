# SABCA — State Association of Building & Civil Contractors of Andhra Pradesh

Unified repository for the **SABCA** digital ecosystem (Powered by InfraXpert · Designed & Developed by KodeSpark), built for **Unlisted App Distribution** and state-wide contractor operations across Andhra Pradesh.

---

## Repository Architecture

| Directory | Stack | Purpose |
| :--- | :--- | :--- |
| [**`sabca-app/`**](./sabca-app) | Expo SDK 54 · React Native 0.81 · Expo Router v6 · Supabase | Cross-platform iOS & Android mobile app (Digital Member ID card, QR verification, Face ID / Touch ID biometrics, Grievances, Polls, Government Orders, News/Events, State/Division Directory, Admin Console, and 52 Supabase migrations + 4 Deno Edge Functions). |
| [**`website/`**](./website) | Static HTML5 · CSS3 · Vanilla JS | Unified public portal (`index.html` Contact Us, `delete.html` Account Deletion walkthrough, `privacy.html` Privacy Policy, `terms.html` Terms & Conditions), hosted on Vercel. |
| [**`docs/`**](./docs) | Fumadocs · Next.js App Router · React 19 · Three.js · Mermaid · Orama | Comprehensive interactive engineering & operations documentation covering mobile app, Supabase backend, web portal, store releases, and troubleshooting. |

---

## Quick Start (`pnpm`)

All JavaScript/TypeScript workspaces use **`pnpm`** (`v10.34.9+`) and **Node.js `22+`/`24`**.

### 1. Developer Documentation Portal (`docs/`)
```bash
cd docs
pnpm install
pnpm dev
# Open http://localhost:3000
```

### 2. Mobile App (`sabca-app/`)
```bash
cd sabca-app
pnpm install
pnpm exec tsc --noEmit
pnpm test
pnpm start
```

> [!NOTE]
> Native modules (`expo-local-authentication`, `expo-secure-store`, `react-native-view-shot`) require a native development build (`npx expo run:ios` / `npx expo run:android`). Avoid running `npx expo prebuild --clean` without preserving the custom URL-forwarding handlers in `ios/SceneDelegate.swift`.

### 3. Unified Web Portal (`website/`)
Pure static files — preview locally with any static HTTP server:
```bash
npx serve website
```

---

**Powered by InfraXpert** · *Designed and Developed by KodeSpark*
