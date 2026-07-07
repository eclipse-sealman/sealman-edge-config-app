import type { components } from "@/generated/edge-administration/types";

type UserTeamAssignmentsResponse = components["schemas"]["UserTeamAssignmentsResponse"];
type UserTeamAssignmentResponse = components["schemas"]["UserTeamAssignmentResponse"];

type UserTeamAssignmentsViewProps = {
  assignments: UserTeamAssignmentsResponse;
};

function TeamAssignment({ assignment }: { assignment: UserTeamAssignmentResponse }) {
  const allPermissions = [
    ...new Set(assignment.roles.flatMap((r) => r.permissions.map((p) => p.name))),
  ].sort();

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{assignment.name}</span>
        {!assignment.scope && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            global
          </span>
        )}
      </div>

      {assignment.scope && (
        <div className="rounded bg-slate-50 px-2.5 py-1.5 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">
            Scope: {assignment.scope.name}
          </p>
          {Object.keys(assignment.scope.attr).length > 0 && (
            <ul className="space-y-0.5">
              {Object.entries(assignment.scope.attr).map(([key, value]) => (
                <li key={key} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{key}:</span>{" "}
                  {Array.isArray(value) ? value.join(", ") : String(value ?? "null")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {assignment.roles.length === 0 ? (
        <p className="text-xs text-muted-foreground">No roles</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Roles:</span>
          {assignment.roles.map((role) => (
            <span
              key={role.name}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {role.name}
            </span>
          ))}
        </div>
      )}

      {allPermissions.length > 0 && (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-muted-foreground">Effective permissions:</span>
          <ul className="space-y-0.5 pl-4 list-disc">
            {allPermissions.map((perm) => (
              <li key={perm} className="text-xs text-muted-foreground">{perm}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function UserTeamAssignmentsView({ assignments }: UserTeamAssignmentsViewProps) {
  if (assignments.teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No teams assigned</p>
    );
  }

  return (
    <div className="space-y-3 min-h-0 flex-1 overflow-y-auto">
      {assignments.teams.map((assignment, index) => (
        <TeamAssignment key={index} assignment={assignment} />
      ))}
    </div>
  );
}
