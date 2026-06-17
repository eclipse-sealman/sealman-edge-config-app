import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { components } from "@/generated/edge-administration/types";

type UserWithTeamsResponse = components["schemas"]["UserWithTeamsResponse"];
type TeamListItemResponse = components["schemas"]["TeamListItemResponse"];

type UserDetailsDialogProps = {
  user: UserWithTeamsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const { data: allTeams } = edgeConfigApiHooks.useGetTeams();

  const teamsById = new Map((allTeams ?? []).map((t: TeamListItemResponse) => [t.id, t]));

  const userTeamDetails = (user?.teams ?? [])
    .map((team) => teamsById.get(team.id))
    .filter(Boolean) as TeamListItemResponse[];

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
              {userTeamDetails.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams assigned</p>
              ) : (
                <div className="space-y-3 min-h-0 flex-1 overflow-y-auto">
                  {userTeamDetails.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-md border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{team.name}</span>
                        {!team.scope && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            global
                          </span>
                        )}
                      </div>

                      {team.scope && (
                        <div className="rounded bg-slate-50 px-2.5 py-1.5 space-y-0.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            Scope: {team.scope.name} <span className="font-normal">({team.scope.access_rule})</span>
                          </p>
                          {Object.keys(team.scope.attr).length > 0 && (
                            <ul className="space-y-0.5">
                              {Object.entries(team.scope.attr).map(([key, value]) => (
                                <li key={key} className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">{key}:</span>{" "}
                                  {Array.isArray(value) ? value.join(", ") : String(value ?? "null")}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {team.roles.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No roles</p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Roles:</span>
                          {team.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {team.roles.length > 0 && (() => {
                        const permissions = [...new Set(team.roles.flatMap((r) => r.actions))].sort();
                        if (permissions.length === 0) return null;
                        return (
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-muted-foreground">Effective permissions:</span>
                            <ul className="space-y-0.5 pl-4 list-disc">
                              {permissions.map((action) => (
                                <li key={action} className="text-xs text-muted-foreground">{action}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
