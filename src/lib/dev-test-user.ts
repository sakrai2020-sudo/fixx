export const DEV_TEST_USER = {
  email: "test@fixx.ai",
  password: "nego2025",
} as const;

export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const { hostname, port } = window.location;
  return hostname === "localhost" && (port === "8080" || port === "5173" || port === "");
}
