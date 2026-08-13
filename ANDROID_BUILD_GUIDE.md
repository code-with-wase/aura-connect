# Android Build Guide - Gradle Wrapper

This guide explains how to build and deploy the Android app using the Gradle Wrapper (no Android Studio required).

## Prerequisites

- Node.js v16+ installed
- JDK 11 or 17 installed (set `JAVA_HOME` environment variable)
- Android SDK installed (set `ANDROID_HOME` environment variable)
- Gradle is already bundled in the Android project (via gradlew)

## Windows Setup

### 1. Verify Java Installation
```bash
java -version
# Should show Java 11 or 17
```

### 2. Set JAVA_HOME (PowerShell as Admin)
```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "Machine")
```

### 3. Set ANDROID_HOME (PowerShell as Admin)
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\<YourUsername>\AppData\Local\Android\Sdk", "Machine")
```

## Build Process

### Step 1: Build Web Assets
```bash
cd c:\Users\ADMIN\OneDrive\Desktop\aura-connect
npm run build
```

### Step 2: Sync with Android
```bash
npx capacitor sync android
```

### Step 3: Build APK

#### Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
# APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
```

#### Release APK (for publishing)
```bash
cd android
./gradlew assembleRelease
# APK will be at: android\app\build\outputs\apk\release\app-release.apk
```

### Step 4: Install on Device/Emulator

#### Via Gradle
```bash
cd android
./gradlew installDebug
```

#### Via ADB (Android Debug Bridge)
```bash
# List connected devices
adb devices

# Install APK
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Launch app
adb shell am start -n com.aura.connect/.MainActivity
```

## Common Gradle Commands

```bash
cd android

# Clean previous builds
./gradlew clean

# Build APK
./gradlew assembleDebug       # Debug APK
./gradlew assembleRelease     # Release APK

# Install on device
./gradlew installDebug        # Install and run
./gradlew installRelease      # Install release build

# Run tests
./gradlew test

# View dependencies
./gradlew dependencies

# Help
./gradlew help
./gradlew tasks
```

## Signing Release APK

To publish on Google Play, you need to sign the APK with a keystore.

### Create Keystore (one-time)
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### Sign the Release APK
```bash
cd android
./gradlew assembleRelease

# Sign using jarsigner
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore <path/to/my-release-key.keystore> app\build\outputs\apk\release\app-release-unsigned.apk my-key-alias

# Align the APK (for Play Store)
zipalign -v 4 app\build\outputs\apk\release\app-release-unsigned.apk aura-connect.apk
```

## Troubleshooting

### "ANDROID_HOME not set"
- Windows: Use command above to set environment variable
- Restart terminal/PowerShell after setting

### "Could not find gradle"
- Ensure you're in the `android` directory
- Try: `./gradlew clean` to bootstrap gradle

### "Build failed: R files cannot be resolved"
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### APK Not Installing
```bash
# Uninstall previous version
adb uninstall com.aura.connect

# Try installing again
adb install app\build\outputs\apk\debug\app-debug.apk
```

## Performance Tips

- Use `--parallel` for faster builds: `./gradlew assembleDebug --parallel`
- Use `--daemon` to keep gradle running: configured by default
- Build incrementally during development
- Use `bundleDebugJsAndAssets` to skip JS bundling if unchanged

---

For more info: [Gradle Documentation](https://gradle.org/docs/)
For Capacitor Android: [Capacitor Android Docs](https://capacitorjs.com/docs/android)
