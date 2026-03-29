import { NativeModules, Platform } from "react-native";

const DEFAULT_PORT = "8000";

const getDevHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;

  if (!scriptURL) {
    return null;
  }

  const match = scriptURL.match(/https?:\/\/([^/:]+)(?::\d+)?/i);
  return match?.[1] || null;
};

const DEV_HOST = getDevHost();

// Ordered by priority: LAN for real device, emulator host mapping, then localhost.
const API_CANDIDATES = [
  DEV_HOST ? `http://${DEV_HOST}:${DEFAULT_PORT}` : null,
  `http://192.168.100.32:${DEFAULT_PORT}`,
  Platform.OS === "android" ? `http://10.0.2.2:${DEFAULT_PORT}` : null,
  `http://127.0.0.1:${DEFAULT_PORT}`,
  `http://localhost:${DEFAULT_PORT}`
].filter(Boolean);

export const getApiCandidates = () => API_CANDIDATES;

export const apiRequest = async (path, options = {}) => {
  let lastNetworkError = null;

  for (const baseUrl of API_CANDIDATES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastNetworkError = error;
    }
  }

  throw lastNetworkError || new Error("No se pudo conectar con la API");
};
