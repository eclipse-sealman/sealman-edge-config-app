import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { useAuth } from "@/auth";
import { UserTeamAssignmentsView } from "@/features/authorization/UserTeamAssignmentsView";
import PageTitle from "@/components/Typography/PageTitle";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { getErrorMessage } from "@/lib/errors";

export default function UserProfile() {
  const { data: currentUser, isError, error } = edgeConfigApiHooks.useGetCurrentUser();
  const { data: userTeamAssignments } = edgeConfigApiHooks.useGetCurrentUserTeams();

  const auth = useAuth();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageTitle title={auth.user?.name ?? "User Profile"} description="Your account and the teams you belong to." />

        <div className="space-y-6 rounded-lg border bg-background p-6 shadow-xs">
          {isError ? (
            <ErrorState title="Could not load your profile" message={getErrorMessage(error)} />
          ) : currentUser ? (
            <>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Username</dt>
                  <dd className="font-medium">{currentUser.preferred_username}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Administrator</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        currentUser.is_admin
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {currentUser.is_admin ? "Yes" : "No"}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 border-t pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teams</h3>
                {userTeamAssignments ? (
                  <UserTeamAssignmentsView assignments={userTeamAssignments} />
                ) : (
                  <LoadingState className="justify-start p-0" />
                )}
              </div>
            </>
          ) : (
            <LoadingState />
          )}
        </div>
      </div>
    </div>
  );
}
