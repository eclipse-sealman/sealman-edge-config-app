import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border bg-background px-10 py-12 text-center shadow-xs">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-vibrant-blue">
          <FileQuestion className="h-7 w-7" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
        </div>
        <Button asChild>
          <Link to="/">Go to the dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
