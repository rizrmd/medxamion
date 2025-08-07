import { api } from "@/lib/api";
import { useLocal } from "@/lib/hooks/use-local";
// import { notif } from "@/lib/notif";
import { navigate } from "@/lib/router";
import { type FC, type ReactNode } from "react";
import type { User } from "shared/types";
import { Alert } from "../ui/global-alert";
import { AppLoading } from "./loading";

export const current = {
  user: null as User | null,
  session: null as any | null,
  loaded: false,
  missing_role: [] as string[],
  promise: null as null | Promise<void>,
  done: () => {},

  async reload() {
    try {
      // Get session from API using cookies
      const response = await api.auth_session();
      
      if (response?.success && response.data) {
        current.user = response.data.user;
        current.session = response.data.session;
      } else {
        current.user = null;
        current.session = null;
      }
      
      current.loaded = true;
      current.promise = null;
      this.done();
    } catch (error) {
      console.error('Failed to load session:', error);
      current.user = null;
      current.session = null;
      current.loaded = true;
      current.promise = null;
      this.done();
    }
  },
};

export const Protected: FC<{
  children:
    | ReactNode
    | ((opt: { user: User | null; missing_role: string[] }) => ReactNode);
  role?: string | string[] | "any";
  onLoad?: (opt: { user: null | User }) => void | Promise<void>;
  fallbackUrl?: string | null;
  allowGuest?: boolean;
  pages?: string[] | null;
}> = ({ children, role, onLoad, fallbackUrl, allowGuest, pages }) => {
  const local = useLocal({}, async () => {
    if (!current.loaded) {
      if (!current.promise) {
        current.promise = current.reload();
      }
      await current.promise;

      if (!allowGuest && !current.user) {
        if (fallbackUrl) {
          navigate(fallbackUrl);
        }
      } else {
        if (current.user?.id) {
          // notif.init(current.user.id);
          // Clean up user data if needed
        }

        if (role !== "any") {
          const roles = Array.isArray(role) ? role : [role];
          current.missing_role = [];
          for (const r of roles) {
            if (
              current.user &&
              current.user.role !== r
            ) {
              if (r) current.missing_role.push(r);
            }
          }
          if (roles.length > 0 && current.missing_role.length < roles.length)
            current.missing_role = [];
        }

        if (!allowGuest && !current.user) Alert.info("Error loading session");
        if (onLoad) {
          onLoad({ user: current.user });
        }
      }
      local.render();
    }
  });
  current.done = local.render;

  if (current.promise) return <AppLoading />;

  if (!!fallbackUrl && !current.user) navigate(fallbackUrl);
  if (current.missing_role.length > 0) {
    if (fallbackUrl) {
      navigate(fallbackUrl);
      return;
    }

    return <div>Access Denied</div>;
  }

  return (
    <>
      {typeof children === "function"
        ? children({ user: current.user, missing_role: current.missing_role })
        : children}
    </>
  );
};