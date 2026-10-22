import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/page-state";

interface ErrorPageParams {
  error?: Error,
  componentStack?: string,
  resetError?: () => void
}

export default function ErrorFallback({ error, resetError }: ErrorPageParams) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="rounded-xl border bg-background shadow-xs">
        <ErrorState
          title="This page could not be displayed"
          message={error?.message}
          onRetry={resetError}
        />
        <div className="flex justify-center pb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Go to the dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
