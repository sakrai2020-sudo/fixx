/** OAuth redirect target — must match Supabase Auth → URL Configuration redirect allow list. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

export const LOCAL_SITE_URL = "http://localhost:8080";

export const OAUTH_REDIRECT_URI = `${LOCAL_SITE_URL}${AUTH_CALLBACK_PATH}`;

export function getOAuthRedirectUri(): string {
  return OAUTH_REDIRECT_URI;
}

export const SUPABASE_AUTH_URL_CONFIG = {
  siteUrl: LOCAL_SITE_URL,
  allowedUrls: [LOCAL_SITE_URL, OAUTH_REDIRECT_URI],
  redirectUrls: [OAUTH_REDIRECT_URI],
} as const;
