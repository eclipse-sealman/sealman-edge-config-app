import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { useAuth } from "@/auth";
import { UserTeamAssignmentsView } from "@/features/authorization/UserTeamAssignmentsView";

export default function UserProfile() {
  const { data: currentUser } = edgeConfigApiHooks.useGetCurrentUser();
  const { data: userTeamAssignments } = edgeConfigApiHooks.useGetCurrentUserTeams();

  const auth = useAuth();

  return (
    <div className="h-full overflow-y-auto bg-gray-200">
      <div className="p-6 flex justify-center">
        <div className="max-w-3xl w-full rounded-lg border bg-white p-6 shadow-sm space-y-6">
      <h1 className="text-2xl font-bold">{auth.user?.name ?? "User Profile"}</h1>

      {currentUser ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Username</span>
              <p className="font-medium">{currentUser.preferred_username}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Is Admin</span>
              <p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    currentUser.is_admin
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {currentUser.is_admin ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Teams</h4>
            {userTeamAssignments ? (
              <UserTeamAssignmentsView assignments={userTeamAssignments} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
        </div>
      </div>
    </div>
  );
}
