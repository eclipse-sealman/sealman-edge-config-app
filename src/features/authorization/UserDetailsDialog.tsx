import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { components } from "@/generated/edge-administration/types";
import { UserTeamAssignmentsView } from "./UserTeamAssignmentsView";

type UserWithTeamsResponse = components["schemas"]["UserWithTeamsResponse"];

type UserDetailsDialogProps = {
  user: UserWithTeamsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const { data: userTeamAssignments } = edgeConfigApiHooks.useGetUserTeamAssignments(user?.id, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[65vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            User details and team memberships
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="flex flex-col min-h-0 flex-1 space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-muted-foreground">Username</span>
                  <p className="font-medium">{user.preferred_username}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Last Active</span>
                  <p>
                    {user.last_active
                      ? new Date(user.last_active).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-muted-foreground">Is Admin</span>
                  <p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.is_admin
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.is_admin ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Is New</span>
                  <p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.is_new
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.is_new ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 min-h-0 flex-1 flex flex-col">
              <h4 className="text-sm font-semibold">Teams</h4>
              {userTeamAssignments ? (
                <UserTeamAssignmentsView assignments={userTeamAssignments} />
              ) : (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
