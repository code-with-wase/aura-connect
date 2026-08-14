import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export const API_BASE_URL = "https://aura-backend-lake.vercel.app";

export const TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refreshToken";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(accessToken: string, refreshToken?: string | null) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  return config;
});

let refreshing: Promise<string | null> | null = null;

function getCurrentRoutePath() {
  if (typeof window === "undefined") return "/";
  const hashPath = window.location.hash.startsWith("#/") ? window.location.hash.slice(1) : "";
  return hashPath || window.location.pathname || "/";
}

function redirectToLogin() {
  tokenStore.clear();
  if (typeof window !== "undefined") {
    const currentPath = getCurrentRoutePath();
    if (!currentPath.startsWith("/auth")) {
      window.location.hash = "/auth";
    }
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
    const accessToken: string | undefined = data?.data?.accessToken;
    if (!accessToken) return null;
    tokenStore.set(accessToken, data?.data?.refreshToken ?? refreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = typeof config?.url === "string" && config.url.includes("/auth/");

    if (status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true;
      refreshing = refreshing ?? refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(config);
      }
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

const GENERIC_SERVER_MESSAGES = new Set([
  "internal server error",
  "something went wrong",
  "error",
  "",
]);

/** Maps unhelpful backend responses to clear, human messages. */
function friendlyMessage(status: number | undefined, url: string, method: string): string | null {
  const isLogin = url.includes("/auth/login");
  const isRegister = url.includes("/auth/register");
  const isAddContact = url.includes("/contact/") && method === "post";

  if (isLogin && (status === 400 || status === 401 || status === 404 || status === 500)) {
    return "Wrong password or account not found. Please check your details and try again.";
  }
  if (isRegister && (status === 409 || status === 400 || status === 500)) {
    return "This email, username or phone number is already registered.";
  }
  if (isAddContact && status === 500) return "This person is already in your contacts.";

  switch (status) {
    case 400:
      return "Some details are invalid. Please review and try again.";
    case 401:
      return "Session expired. Please sign in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "We could not find what you were looking for.";
    case 409:
      return "That already exists.";
    case 413:
      return "That file is too large.";
    case 415:
      return "That file type is not supported.";
    case 422:
      return "Some fields are not valid. Please review the form.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Please try again shortly.";
    default:
      return null;
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return "The request took too long to respond. Please try again.";
    }
    if (!error.response) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return "You appear to be offline. Check your internet connection and try again.";
      }
      return "Unable to reach the server right now. Please try again in a moment.";
    }

    const data = error.response.data as
      | { message?: string; errors?: Array<{ field?: string; message?: string }> | Record<string, string> }
      | undefined;
    const status = error.response.status;
    const url = error.config?.url ?? "";
    const method = (error.config?.method ?? "get").toLowerCase();

    if (Array.isArray(data?.errors) && data.errors[0]?.message) return data.errors[0].message!;

    const serverMessage = typeof data?.message === "string" ? data.message.trim() : "";
    if (serverMessage && !GENERIC_SERVER_MESSAGES.has(serverMessage.toLowerCase())) {
      return serverMessage;
    }

    return friendlyMessage(status, url, method) ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default axiosInstance;
