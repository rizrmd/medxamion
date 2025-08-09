import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ECrudErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ECrudErrorBoundaryProps {
  children: React.ReactNode;
  entityName?: string;
  onReset?: () => void;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    entityName?: string;
  }>;
}

export class ECrudErrorBoundary extends React.Component<
  ECrudErrorBoundaryProps,
  ECrudErrorBoundaryState
> {
  constructor(props: ECrudErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ECrudErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ECrud Error:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Log to error tracking service if available
    if ((window as any).errorTracker) {
      (window as any).errorTracker.captureException(error, {
        context: "ECrud",
        entityName: this.props.entityName,
        errorInfo,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback && this.state.error) {
        return (
          <Fallback
            error={this.state.error}
            resetError={this.handleReset}
            entityName={this.props.entityName}
          />
        );
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Terjadi Kesalahan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Terjadi kesalahan saat memuat {this.props.entityName || "data"}. 
              Silakan coba lagi atau hubungi tim teknis jika masalah berlanjut.
            </p>
            
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="font-medium cursor-pointer">
                  Detail Kesalahan (Development)
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.handleReset} className="flex items-center gap-2">
                <RefreshCw size={16} />
                Coba Lagi
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Muat Ulang Halaman
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping ECrud with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  entityName?: string
) {
  return React.forwardRef<any, T>((props, ref) => (
    <ECrudErrorBoundary entityName={entityName}>
      <Component {...(props as any)} ref={ref} />
    </ECrudErrorBoundary>
  ));
}

// Hook for error recovery
export function useECrudErrorRecovery(entityName?: string) {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error: Error) => {
    console.error(`ECrud Error in ${entityName}:`, error);
    setError(error);
  }, [entityName]);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    error,
    retryCount,
    handleError,
    retry,
    reset,
  };
}