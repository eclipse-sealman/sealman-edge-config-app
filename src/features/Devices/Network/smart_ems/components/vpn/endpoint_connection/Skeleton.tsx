import { Skeleton as _Skeleton } from "@/components/ui/skeleton";

export function Skeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <div className="space-y-2">
        <_Skeleton className="h-4 w-4/5" />
        <_Skeleton className="h-4 w-3/5" />
        <_Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}
