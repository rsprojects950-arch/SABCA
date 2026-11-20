# SABCA — State Contractors Association Mobile App

Official mobile portal built for the **State Association of Building & Civil Contractors of Andhra Pradesh (SABCA)** using Expo SDK 54, React Native 0.81 (New Architecture: Fabric + TurboModules), Expo Router v6, and Supabase.

> [!TIP]
> **Full Engineering Documentation:** Comprehensive interactive developer documentation—covering Auth & Biometrics, iOS Deep Linking, Digital ID Card formatting & 3D explorer, Supabase 52 migrations & Edge Functions, and App Store Unlisted Distribution runbooks—is now maintained in the root **[`docs/`](../docs)** Fumadocs portal (`cd ../docs && pnpm dev`).

---

## Key Features

### Member Services
- **Digital Member ID Card:** Official `85.6mm × 54mm` card rendered on-screen and exported as JPG (`react-native-view-shot`) or PDF (`expo-print`) with signed SHA-256 QR verification passes (`react-native-qrcode-svg`).
- **Biometric Security:** Face ID / Touch ID quick sign-in backed by iOS Keychain (`expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`) and Supabase `refreshSession`.
- **Self-Service Profile & Account Deletion:** Update company, district/division, blood group, GST, and Aadhaar; instant GDPR/Apple 5.1.1(v) in-app account deletion via `delete_own_account` RPC.
- **State & Division Directory:** Searchable contractor & committee directory across all 16 Andhra Pradesh divisions plus State Head Office, with Apple Guideline 1.2 press-and-hold member report/block moderation.

### Information & Grievance Redressal
- **Government Orders (G.O.):** Direct access to engineering department circulars and downloads.
- **Grievance Tracking:** Submit itemized grievances with attachments, track escalation status, and trigger automated email alerts via Supabase Edge Functions.
- **News, Events & Polls:** Real-time community polls (`poll_questions` / `poll_votes`) and association updates with English & Telugu (`i18next`) support.

### Role-Based Admin Console
- Member approval (`SABCA-{Code}-{Type}-{Seq}` auto-generation), PDF receipt generation, user management, directory editing, and content publishing (`admin/*`).

---

## Tech Stack & Directory Map

- **Framework:** Expo `^54.0.33`, React `19.1.0`, React Native `0.81.5`, Expo Router `^6.0.23`
- **Backend:** `@supabase/supabase-js` `^2.93.3` (PostgreSQL + RLS + `pg_cron` + Storage + 4 Deno Edge Functions)
- **State & Localization:** `@tanstack/react-query` v5, `i18next` / `react-i18next` (`en.json`, `te.json`)
- **UI & Security:** `expo-blur`, `expo-linear-gradient`, `lucide-react-native`, `expo-secure-store`, `expo-local-authentication`

```text
sabca-app/
├── app/          # Expo Router v6 screens ((auth), (tabs), admin, member, services, directory, events, news, notifications, onboarding)
├── components/   # Reusable UI primitives & themed components
├── constants/    # Colors, theme, DISTRICTS, MEMBERSHIP_TYPES, Base64Images
├── ctx/          # AuthContext, ModerationContext, ThemeContext, LanguageContext, ToastContext
├── hooks/        # useBiometrics, useHaptics, useDebounce, color scheme hooks
├── lib/          # Supabase client, React Query config, i18next init, PDF receipt generator
├── locales/      # English (en.json) & Telugu (te.json) translations
├── utils/        # authDeepLink, idCardFormatter, crypto_utils, edge_case_utils
├── tests/        # 8 Node test runner suites (node --test tests/*.test.js)
├── supabase/     # 52 SQL migrations + 4 Deno Edge Functions
├── ios/          # Gitignored Xcode project (includes custom URL-forwarding SceneDelegate.swift)
└── android/      # Gitignored Android Gradle project
```

---

## Getting Started (`pnpm`)

### Prerequisites
- **Node.js** `22.x` or `24.x`
- **pnpm** `10.34.9` (`corepack enable`)
- **Xcode** (macOS, iOS 15.1+ SDK) / **Android Studio**

### Installation & Environment
```bash
cd sabca-app
pnpm install
```

Create `.env` in `sabca-app/`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional: EXPO_PUBLIC_QR_SALT=...
```

### Development & Verification Commands
```bash
# TypeScript check
pnpm exec tsc --noEmit

# Run automated compliance, auth, deep-link, ID card & moderation tests
pnpm test

# Start Metro bundler
pnpm start

# Native development builds (required for Face ID / Keychain / ViewShot)
pnpm run ios
pnpm run android
```

---

## Documentation
- **Authoritative Docs Portal:** [`../docs`](../docs) *(Fumadocs interactive portal)*
- **Legacy Reference Notes:** [`./docs/DEPLOYMENT_GUIDE.md`](./docs/DEPLOYMENT_GUIDE.md), [`./docs/MIGRATION_ORDER.md`](./docs/MIGRATION_ORDER.md), [`./docs/SECURITY_REPORT.md`](./docs/SECURITY_REPORT.md)

---
**Powered By InfraXpert** · *Designed and Developed by KodeSpark*
