# Aura Connect: TanStack to React + Vite + Capacitor Migration Guide

## ✅ Migration Completed Successfully

Your TanStack Start project has been successfully migrated to **React + Vite** and configured as a **Capacitor hybrid mobile app** supporting both **Android and iOS**.

---

## Project Structure Overview

```
aura-connect/
├── src/
│   ├── main.tsx                 # React entry point (new)
│   ├── router.tsx              # Client-side router configuration
│   ├── routeTree.gen.ts        # Auto-generated route tree
│   ├── routes/
│   │   ├── __root.tsx          # Root layout (updated for CSR)
│   │   └── [other routes]
│   ├── components/             # UI components (unchanged)
│   ├── services/               # API services (unchanged)
│   └── lib/                    # Utilities and helpers (unchanged)
├── index.html                   # HTML entry point (new)
├── vite.config.ts              # Vite configuration (updated)
├── capacitor.config.json       # Capacitor mobile configuration
├── android/                     # Android native project (new)
├── ios/                         # iOS native project (new)
├── dist/                        # Production build output
├── package.json                # Updated dependencies
└── tsconfig.json               # TypeScript config (compatible with Vite)
```

---

## Key Changes Made

### 1. **Package.json Updates**
- ✅ Removed: `@tanstack/react-start`, `@lovable.dev/vite-tanstack-config`, `nitro`
- ✅ Added: `@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/app`, `@capacitor/splash-screen`, `@capacitor/status-bar`
- ✅ Updated: Scripts to include Capacitor commands (`npm run cap`, `npm run cap:sync`, etc.)

### 2. **Vite Configuration**
- ✅ Converted from TanStack custom config to standard React + Vite setup
- ✅ Added: `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`
- ✅ Configured: Path aliases (`@/*`), build output to `dist/`, proper port settings

### 3. **Entry Points**
- ✅ Created `index.html` - main HTML entry point for browser and mobile
- ✅ Created `src/main.tsx` - React app initialization with:
  - Capacitor plugin initialization (SplashScreen, StatusBar, App lifecycle)
  - React Router setup
  - React StrictMode enabled

### 4. **Routing Migration**
- ✅ Updated `src/router.tsx` - works with client-side rendering
- ✅ Modified `src/routes/__root.tsx`:
  - Removed SSR-specific imports (`HeadContent`, `Scripts`)
  - Removed `head` property from route definition
  - Removed `RootShell` component
  - Moved theme initialization to `useEffect` hook
  - Kept all UI components and functionality intact

### 5. **Capacitor Configuration**
- ✅ Created `capacitor.config.json` with:
  - App ID: `com.aura.connect`
  - Web directory: `dist/` (Vite build output)
  - Status bar and splash screen configuration
  - Platform-specific settings

### 6. **Mobile Platforms**
- ✅ Android platform added with Gradle build configuration
- ✅ iOS platform added with Xcode project setup
- ✅ Both platforms pre-configured with Capacitor plugins

---

## Build and Deployment Workflow

### For Development (Web)
```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
```

### For Production Build
```bash
npm run build            # Build optimized dist folder
npx cap sync            # Sync web assets to Android and iOS
```

### Android Build and Run
```bash
# Option 1: Using Gradle Wrapper (no Android Studio required)
cd android
./gradlew assembleDebug    # Build APK
./gradlew installDebug     # Install on connected device

# Option 2: Using Android Studio
# Open android/ folder in Android Studio and build from IDE
```

### iOS Build and Run
```bash
# iOS development requires macOS and Xcode
# Open ios/App/App.xcworkspace in Xcode and build from there
# Or use command line:
cd ios
pod install              # Install dependencies (if not already done)
xcodebuild -workspace App/App.xcworkspace -scheme App -configuration Debug
```

---

## Important Notes

### ✅ Preserved Functionality
- All existing UI components and Radix UI integration
- All API services and backend integration (axios, socket.io)
- All routing functionality with TanStack Router
- All state management and context (AuthProvider, etc.)
- Styling with Tailwind CSS
- Form handling with React Hook Form

### ⚠️ Considerations for Mobile

1. **API Base URLs**
   - Ensure API endpoints use absolute URLs
   - Update `VITE_API_URL` or similar environment variables for different environments
   - Consider CORS issues when connecting to backend from mobile

2. **Environment Variables**
   - Create `.env` files for different environments:
     ```
     .env.development    # For dev server
     .env.production     # For mobile builds
     ```
   - Update `vite.config.ts` to handle env variables if needed

3. **Mobile-specific Code**
   - Capacitor plugins can be used in components (already initialized in main.tsx)
   - Check for platform in runtime: `Capacitor.getPlatform()` returns "web", "ios", or "android"

4. **Asset Paths**
   - All assets in `public/` folder are copied to dist/
   - Reference assets with absolute paths: `/image.png`

5. **Status Bar and Splash Screen**
   - Configured in `capacitor.config.json`
   - Splash screen hides automatically after app is ready
   - Status bar style set to "dark"

---

## Running on Devices

### Android (Gradle Wrapper Method)
```bash
# Terminal in project root
npm run build           # Build web assets
npx cap sync           # Sync to Android

# In android/ subdirectory
./gradlew assembleDebug -x bundleDebugJsAndAssets
./gradlew installDebug  # Install on device via ADB
```

### iOS (Xcode Required)
```bash
# Terminal in project root
npm run build
npx cap sync

# In Xcode
open ios/App/App.xcworkspace
# Select target device/simulator and press Play
```

---

## Next Steps

1. **Update Environment Variables**
   - Create `.env.development` and `.env.production` files
   - Update API endpoints for your backend

2. **Configure App Icons and Splash Screens**
   - Replace placeholder icons in:
     - `android/app/src/main/res/`
     - `ios/App/App/Assets.xcassets/`

3. **Update App Metadata**
   - Android: `android/app/src/main/AndroidManifest.xml`
   - iOS: `ios/App/App/Info.plist`

4. **Implement Native Plugins** (if needed)
   - Camera, geolocation, notifications, etc.
   - Capacitor has official plugins for many features

5. **Test on Physical Devices**
   - Android: Use `adb` to test
   - iOS: Use Xcode or TestFlight

6. **Set Up CI/CD** (optional)
   - GitHub Actions, Fastlane, or similar for automated builds

---

## Troubleshooting

### Build Issues
- Clear `dist/` and `node_modules/`, then reinstall: `rm -rf dist node_modules && npm install && npm run build`
- Ensure Node.js version is compatible (v16+)

### Capacitor Sync Issues
- Regenerate lock file: `npm install`
- Fully clean and rebuild: `npx cap sync --force`

### Android Build Issues
- Ensure JAVA_HOME and ANDROID_HOME are set correctly
- Use `./gradlew clean` in android/ before rebuilding

### iOS Build Issues
- Run `pod install` in ios/App/ directory
- Ensure Xcode and CocoaPods are up to date

---

## Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Linting & Formatting
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Capacitor
npx cap sync            # Sync web assets to native projects
npx cap build           # Build native apps
npx cap open android    # Open Android Studio with project
npx cap open ios        # Open Xcode with project
npx cap copy            # Copy web assets only (without plugins)

# Gradlewrapper (Android)
cd android && ./gradlew assembleDebug  # Build APK
cd android && ./gradlew installDebug   # Install on device
```

---

## Project Status: ✅ Ready for Development

Your project is now fully configured and ready for:
- ✅ Web development (`npm run dev`)
- ✅ Production web deployment
- ✅ Android hybrid app development and deployment
- ✅ iOS hybrid app development and deployment (on macOS)

Build and deploy using the workflows outlined above. All existing functionality has been preserved while adding cross-platform mobile capabilities!
