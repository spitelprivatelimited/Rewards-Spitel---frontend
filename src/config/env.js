/**
 * Environment configuration management
 * This file provides centralized access to environment variables
 */

export const getEnvConfig = () => {
  const env = import.meta.env.VITE_ENV || "dev";
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL;

  return {
    env,
    backendUrl,
    isDev: env === "dev",
    isQA: env === "qa",
    isProduction: env === "production",
  };
};

export const envConfig = getEnvConfig();
