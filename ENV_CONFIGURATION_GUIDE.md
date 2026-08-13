# Environment Configuration Guide

This guide explains how to manage environment variables for different environments (development, production, mobile).

## File Structure

```
aura-connect/
├── .env                    # Default variables (if needed)
├── .env.development       # Development (dev server)
├── .env.production        # Production (web & mobile)
├── .env.staging           # Staging (optional)
└── .env.local             # Local overrides (not committed)
```

## Creating Environment Files

### .env.development
Used for local development with `npm run dev`

```env
# Development API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development

# Feature Flags
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### .env.production
Used for `npm run build` (web, Android, iOS)

```env
# Production API Configuration
VITE_API_BASE_URL=https://api.aura-connect.com
VITE_API_TIMEOUT=15000
VITE_WS_URL=wss://api.aura-connect.com
VITE_ENV=production

# Feature Flags
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error

# App Version (optional)
VITE_APP_VERSION=1.0.0
```

## Accessing Environment Variables in Code

### In React Components
```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const debugMode = import.meta.env.VITE_DEBUG_MODE;

console.log(import.meta.env);  // See all variables
```

### In Services (e.g., axios.ts)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT,
});

export default api;
```

### Environment Detection
```typescript
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const mode = import.meta.env.MODE;  // "development" or "production"
```

## Important: Vite Environment Variables

### Naming Convention
- Variables must start with `VITE_` to be exposed to the client
- Variables without `VITE_` prefix are server-only (not available in browser)

### Example:
```env
# ✅ Available in browser
VITE_API_URL=https://api.example.com

# ❌ NOT available in browser (server-only)
SECRET_KEY=my_secret_key
```

## Build Process with Environments

### Development Build
```bash
npm run build --mode development
# Uses: .env.development (if it exists), then falls back to .env
```

### Production Build
```bash
npm run build --mode production
# Uses: .env.production (if it exists), then falls back to .env
```

### Default (Production Mode)
```bash
npm run build
# Uses: .env.production
```

## Configuration for Different Platforms

### Web (Desktop/Browser)
```bash
VITE_API_BASE_URL=https://web-api.example.com
VITE_WS_URL=wss://web-api.example.com
```

### Mobile (Android/iOS)
Mobile apps typically use the same API as web, but you can have different domains if needed:

```bash
# Same API for both web and mobile
VITE_API_BASE_URL=https://api.example.com

# Or separate API for mobile (if needed)
VITE_MOBILE_API_URL=https://mobile-api.example.com
```

Then in your service:
```typescript
import { Capacitor } from '@capacitor/core';

const apiUrl = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_MOBILE_API_URL
  : import.meta.env.VITE_API_BASE_URL;
```

## Security Best Practices

1. **Never commit sensitive keys to git**
   - Add `.env.local` to `.gitignore`
   - Store production secrets in CI/CD environment variables

2. **Use `.env.local` for personal development**
   ```bash
   # .env.local (not committed)
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Rotate keys regularly** in production

4. **Use different API keys for different environments**

## Example: Update axios.ts

Here's how to configure axios to use environment variables:

```typescript
// src/lib/axios.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  timeout: import.meta.env.VITE_API_TIMEOUT ? parseInt(import.meta.env.VITE_API_TIMEOUT) : 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging in dev mode
if (import.meta.env.DEV) {
  axiosInstance.interceptors.request.use((config) => {
    console.log('Request:', config);
    return config;
  });
}

export default axiosInstance;
```

## Testing Environment Configuration

### Check if variables are loaded
```bash
# Add this to src/main.tsx temporarily
console.log('Environment:', {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  env: import.meta.env.MODE,
});
```

### View .env file that will be used
```bash
# Vite will log which .env file it's using during build
npm run build
# Look for output like: "using .env.production"
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build for Production
  env:
    VITE_API_BASE_URL: ${{ secrets.PROD_API_URL }}
    VITE_WS_URL: ${{ secrets.PROD_WS_URL }}
  run: npm run build
```

### Jenkins Example
```groovy
environment {
    VITE_API_BASE_URL = credentials('prod-api-url')
    VITE_WS_URL = credentials('prod-ws-url')
}
```

---

## Summary

1. Create `.env` files for different environments
2. Variables must start with `VITE_` to be exposed to frontend
3. Access via `import.meta.env.VARIABLE_NAME`
4. Different APIs can be used for web vs mobile if needed
5. Never commit sensitive information to git
6. Use `.env.local` for personal development overrides

For more info: [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
