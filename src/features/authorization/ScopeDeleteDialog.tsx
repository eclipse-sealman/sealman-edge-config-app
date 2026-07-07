import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";

type ScopeDeleteDialogProps = {
  scopeId: string | null;
  scopeName: string;
  teamUsageCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScopeDeleteDialog({
  scopeId,
  scopeName,
  teamUsageCount,
  open,
  onOpenChange,
}: ScopeDeleteDialogProps) {
  const deleteScopeMutation = edgeConfigApiHooks.useDeleteScope();
  const shouldLoadDetails = open && Boolean(scopeId) && teamUsageCount > 0;
  const { data: scopeDetails, isLoading, isError, error } = edgeConfigApiHooks.useGetScopeDetails(
    scopeId ?? undefined,
    shouldLoadDetails,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDeleteError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!scopeId) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteScopeMutation.mutateAsync(scopeId);
      onOpenChange(false);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error).message;
      setDeleteError(message);
    }
  };

  const teams = scopeDetails?.teams ?? [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {teamUsageCount > 0 ? "Scope is in use" : "Delete scope?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {teamUsageCount > 0 ? (
              <>
                This scope cannot be deleted because it is used by {teamUsageCount} team
                {teamUsageCount === 1 ? "" : "s"}.
              </>
            ) : (
              <>This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {teamUsageCount > 0 && (
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading teams...</p>
            ) : isError ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {(error as Error).message}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Used by the following team{teams.length === 1 ? "" : "s"}:
                </p>
                <ul className="max-h-48 overflow-auto rounded-md border bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  {teams.map((team) => (
                    <li key={team.id} className="py-1">
                      {team.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {teamUsageCount === 0 && (
          <p className="text-sm text-muted-foreground">
            Scope <span className="font-medium text-foreground">{scopeName}</span> will be permanently deleted.
          </p>
        )}

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {deleteError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteScopeMutation.isPending}>Cancel</AlertDialogCancel>
          {teamUsageCount === 0 && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteScopeMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteScopeMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}