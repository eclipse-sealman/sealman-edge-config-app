import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";

type RoleDeleteDialogProps = {
  roleId: string | null;
  roleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoleDeleteDialog({
  roleId,
  roleName,
  open,
  onOpenChange,
}: RoleDeleteDialogProps) {
  const deleteRoleMutation = edgeConfigApiHooks.useDeleteRole();
  const { data: roleDetails, isLoading, isError, error } = edgeConfigApiHooks.useGetRoleDetails(
    roleId ?? undefined,
    open && Boolean(roleId),
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDeleteError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!roleId) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteRoleMutation.mutateAsync(roleId);
      onOpenChange(false);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error).message;
      setDeleteError(message);
    }
  };

  const teams = roleDetails?.teams ?? [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete role?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p className="text-sm text-muted-foreground">
          Role <span className="font-medium text-foreground">{roleName}</span> will be permanently deleted.
        </p>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading role details...</p>
        )}

        {isError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {(error as Error).message}
          </p>
        )}

        {teams.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This role is assigned to the following team{teams.length === 1 ? "" : "s"}:
            </p>
            <ul className="max-h-48 overflow-auto rounded-md border bg-slate-50 px-4 py-2 text-sm text-slate-700">
              {teams.map((team) => (
                <li key={team.id} className="py-1">
                  {team.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {deleteError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRoleMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRoleMutation.isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {deleteRoleMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
