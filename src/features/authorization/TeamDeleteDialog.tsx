import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";

type TeamDeleteDialogProps = {
  teamId: string | null;
  teamName: string;
  userCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeamDeleteDialog({
  teamId,
  teamName,
  userCount,
  open,
  onOpenChange,
}: TeamDeleteDialogProps) {
  const deleteTeamMutation = edgeConfigApiHooks.useDeleteTeam();
  const shouldLoadDetails = open && Boolean(teamId) && userCount > 0;
  const { data: teamDetails, isLoading, isError, error } = edgeConfigApiHooks.useGetTeamDetails(
    teamId ?? undefined,
    shouldLoadDetails,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDeleteError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!teamId) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteTeamMutation.mutateAsync(teamId);
      onOpenChange(false);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error).message;
      setDeleteError(message);
    }
  };

  const users = teamDetails?.users ?? [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {userCount > 0 ? "Team has assigned users" : "Delete team?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {userCount > 0 ? (
              <>
                This team cannot be deleted because it has {userCount} assigned user
                {userCount === 1 ? "" : "s"}.
              </>
            ) : (
              <>This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {userCount > 0 && (
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : isError ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {(error as Error).message}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Assigned user{users.length === 1 ? "" : "s"}:
                </p>
                <ul className="max-h-48 overflow-auto rounded-md border bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  {users.map((user) => (
                    <li key={user.id} className="py-1">
                      {user.preferred_username}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {userCount === 0 && (
          <p className="text-sm text-muted-foreground">
            Team <span className="font-medium text-foreground">{teamName}</span> will be permanently deleted.
          </p>
        )}

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {deleteError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTeamMutation.isPending}>Cancel</AlertDialogCancel>
          {userCount === 0 && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTeamMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
