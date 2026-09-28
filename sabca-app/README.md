# SABCA - State Contractors Association App

SABCA is a comprehensive mobile application built for the **Engineering & Contractors Association of Andhra Pradesh**. It serves as a unified platform for members to manage their profiles, access digital ID cards, track grievances, and stay updated with the latest government orders and news.

---

## 🚀 Key Features

### 🔹 Member Services
- **Digital ID Card**: Secure digital ID with QR code verification. Includes options to **Download as Image** or **Save as PDF**.
- **Self-Service Profile**: Update personal details, company information, and contractor classification.
- **State Network**: A searchable directory of all division leaders and contractors across the state.
- **Biometric Security**: Secure login via **FaceID/Fingerprint** (Expo Local Authentication).

### 🔹 Information & Communication
- **Government Orders (G.O.)**: Direct access to the latest engineering department releases.
- **News & Events**: Real-time notifications and updates on association activities.
- **Community Polls**: Participation in state-wide decision-making and feedback.
- **Grievance Track**: Submit and track status on professional issues and association grievances.

### 🔹 Admin Dashboard (Role-Based)
- **User Management**: Approve memberships and manage user roles (Admin/Moderator/Member).
- **Content Moderation**: Dynamic management of News, Events, and G.O. documents.
- **Poll Management**: Create and analyze community polls.

---

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev) (React Native) with [Expo Router](https://docs.expo.dev/router/introduction/) (v6).
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL, Authentication, Storage, Edge Functions).
- **State Management**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query) for efficient caching.
- **Styling**: [Vanilla CSS-in-JS](https://reactnative.dev/docs/style) & [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/).
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native).
- **Internalization**: [i18next](https://www.i18next.com/) supporting English and Telugu.

---

## 📦 Key Packages & Dependencies

Beyond the standard Expo core, the following packages are critical to the app's functionality:

| Feature | Package |
|:--- |:--- |
| **Authentication** | `@supabase/supabase-js`, `expo-secure-store`, `expo-local-authentication` |
| **ID Card Storage** | `react-native-view-shot`, `expo-media-library`, `expo-sharing`, `expo-file-system` |
| **PDF Generation** | `expo-print` (HTML-to-PDF conversion) |
| **Digital Verification** | `react-native-qrcode-svg` |
| **Data Fetching** | `@tanstack/react-query` (with `@react-native-async-storage/async-storage`) |
| **UI Components** | `expo-image`, `expo-blur`, `expo-linear-gradient`, `lucide-react-native` |
| **Navigation** | `expo-router` |

---

## 📥 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **npm** or **yarn**
- **iOS Simulator** (macOS only) or **Android Emulator**
- **Expo Go** app on a physical device

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd sabca-app

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Running the App
Since this project uses native modules (Biometrics, View Shot, etc.), it requires a **Development Build**.

```bash
# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Start Metro Bundler
npx expo start
```

---

## 📁 Project Structure

- `app/` - File-based routing (Expo Router). includes `(auth)`, `(tabs)`, `admin`, `member`, etc.
- `components/` - Reusable UI components (Modals, Polls, Badges).
- `constants/` - Color palettes, District lists, and global constants.
- `hooks/` - Custom hooks for Biometrics, Haptics, and API management.
- `lib/` - Third-party configurations (Supabase Client).
- `locales/` - Language translation files (en/te).
- `services/` - Business logic for ID Card generation, PDF prints, and API wrappers.
- `supabase/` - Database migrations and SQL configurations.

---

## 📄 Documentation
For more detailed technical guides, refer to:
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Database Schema & Migrations](./docs/MIGRATION_ORDER.md)

---
**Powered By InfraXpert**  
*Designed and Developed by KodeSpark*
