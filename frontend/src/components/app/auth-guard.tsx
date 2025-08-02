import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import { Spinner } from "@/components/ui/spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserTypes?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({ 
  children, 
  requiredUserTypes, 
  redirectTo = "/auth/login",
  fallback 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      navigate(redirectTo);
      return;
    }

    // Check user type permissions if specified
    if (requiredUserTypes && user && !requiredUserTypes.includes(user.user_type)) {
      // Redirect based on user type
      if (user.user_type === "taker") {
        navigate("/exam");
      } else if (user.user_type === "internal") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      return;
    }
  }, [user, loading, isAuthenticated, requiredUserTypes, redirectTo]);

  // Show loading spinner while checking auth
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  // Check user type permissions
  if (requiredUserTypes && user && !requiredUserTypes.includes(user.user_type)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    requiredUserTypes?: string[];
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Component for admin-only routes
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredUserTypes={["internal"]}>
      {children}
    </AuthGuard>
  );
}

/**
 * Component for taker-only routes  
 */
export function TakerGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredUserTypes={["taker"]}>
      {children}
    </AuthGuard>
  );
}