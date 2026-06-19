import { useEffect, useState } from "react";
import { getLocalUser, localLogout, type LocalUser } from "@/lib/local-auth";

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setUser(getLocalUser());
      setLoading(false);
    };

    sync();
    window.addEventListener("nego-local-auth", sync);
    return () => window.removeEventListener("nego-local-auth", sync);
  }, []);

  return {
    session: user ? { user } : null,
    user,
    loading,
    signOut: localLogout,
  };
}
