import { useEffect, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info, Plus } from "lucide-react";
import type { components } from "@/generated/edge-administration/types";
import { ScopeEditDialog } from "./ScopeEditDialog";
import { RoleEditDialog } from "./RoleEditDialog";

type TeamListItemResponse = components["schemas"]["TeamListItemResponse"];

type TeamEditDialogProps = {
  team: TeamListItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NO_SCOPE_VALUE = "__none__";

export function TeamEditDialog({ team, open, onOpenChange }: TeamEditDialogProps) {
  const createTeamMutation = edgeConfigApiHooks.useCreateTeam();
  const updateTeamMutation = edgeConfigApiHooks.useUpdateTeam();
  const { data: allRoles } = edgeConfigApiHooks.useGetRoles();
  const { data: allScopes } = edgeConfigApiHooks.useGetScopes();
  const { data: allActions } = edgeConfigApiHooks.useGetActions();

  const [name, setName] = useState("");
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateScopeOpen, setIsCreateScopeOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  const isEditMode = Boolean(team);
  const isSaving = createTeamMutation.isPending || updateTeamMutation.isPending;

  const rolesById = new Map((allRoles ?? []).map((r) => [r.id, r]));
  const actionsMap = new Map((allActions ?? []).map((a) => [a.name, a]));

  const availableRoles = (allRoles ?? [])
    .filter((r) => !assignedRoleIds.includes(r.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const assignedRoles = assignedRoleIds
    .map((id) => rolesById.get(id))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name));

  const effectivePermissions = [...new Set(assignedRoles.flatMap((r) => r!.actions))].sort();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (team) {
      setName(team.name);
      setScopeId(team.scope_id ?? null);
      setAssignedRoleIds(team.roles.map((r) => r.id));
    } else {
      setName("");
      setScopeId(null);
      setAssignedRoleIds([]);
    }

    setSelectedAvailable([]);
    setSelectedAssigned([]);
    setError(null);
  }, [open, team]);

  const moveToAssigned = () => {
    if (selectedAvailable.length === 0) return;
    setAssignedRoleIds((prev) => [...prev, ...selectedAvailable]);
    setSelectedAvailable([]);
  };

  const moveToAvailable = () => {
    if (selectedAssigned.length === 0) return;
    setAssignedRoleIds((prev) => prev.filter((id) => !selectedAssigned.includes(id)));
    setSelectedAssigned([]);
  };

  const moveAllToAssigned = () => {
    setAssignedRoleIds((prev) => [...prev, ...availableRoles.map((r) => r.id)]);
    setSelectedAvailable([]);
  };

  const moveAllToAvailable = () => {
    setAssignedRoleIds([]);
    setSelectedAssigned([]);
  };

  const toggleAvailableSelection = (id: string) => {
    setSelectedAvailable((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const toggleAssignedSelection = (id: string) => {
    setSelectedAssigned((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        scope_id: scopeId,
        role_ids: assignedRoleIds,
      };

      if (team) {
        await updateTeamMutation.mutateAsync({ teamId: team.id, payload });
      } else {
        await createTeamMutation.mutateAsync(payload);
      }

      onOpenChange(false);
    } catch (e: unknown) {
      let message = "Failed to save team";

      if (e && typeof e === "object") {
        const err = e as any;
        if (typeof err.response?.data?.message === "string") {
          message = err.response.data.message;
        } else if (typeof err.response?.data?.detail === "string") {
          message = err.response.data.detail;
        } else if (err.response?.statusText) {
          message = `${err.response.status}: ${err.response.statusText}`;
        } else if (typeof err.message === "string") {
          message = err.message;
        }
      } else if (typeof e === "string") {
        message = e;
      }

      setError(message);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit team" : "Create team"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the team name, roles, and scope."
              : "Set team name, assign roles, and select a scope."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Team name"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Roles</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateRoleOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                New role
              </Button>
            </div>
            <div className="flex items-stretch gap-2">
              {/* Available roles */}
              <div className="flex-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground mb-1">Available</p>
                <div className="border rounded-md h-48 overflow-y-auto bg-white">
                  {availableRoles.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      No available roles
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {availableRoles.map((role) => (
                        <li
                          key={role.id}
                          onClick={() => toggleAvailableSelection(role.id)}
                          onDoubleClick={() => {
                            setAssignedRoleIds((prev) => [...prev, role.id]);
                            setSelectedAvailable((prev) => prev.filter((a) => a !== role.id));
                          }}
                          className={`px-3 py-1.5 text-sm cursor-pointer select-none flex items-center justify-between gap-1 ${
                            selectedAvailable.includes(role.id)
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span>{role.name}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="p-0.5 rounded hover:bg-slate-200 text-muted-foreground hover:text-foreground"
                                aria-label={`View permissions for ${role.name}`}
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3" side="right" align="start">
                              <p className="text-xs font-semibold mb-1.5">Permissions</p>
                              {role.actions.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No permissions</p>
                              ) : (
                                <ul className="space-y-0.5">
                                  {role.actions.map((action) => (
                                    <li key={action} className="text-xs text-muted-foreground">
                                      {action}{actionsMap.get(action)?.is_global && <span className="font-bold italic text-amber-600"> (global)</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </PopoverContent>
                          </Popover>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Transfer buttons */}
              <div className="flex flex-col items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={moveAllToAssigned}
                  disabled={availableRoles.length === 0}
                  title="Move all to assigned"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={moveToAssigned}
                  disabled={selectedAvailable.length === 0}
                  title="Move selected to assigned"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={moveToAvailable}
                  disabled={selectedAssigned.length === 0}
                  title="Move selected to available"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={moveAllToAvailable}
                  disabled={assignedRoleIds.length === 0}
                  title="Move all to available"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Assigned roles */}
              <div className="flex-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground mb-1">Assigned</p>
                <div className="border rounded-md h-48 overflow-y-auto bg-white">
                  {assignedRoles.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      No assigned roles
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {assignedRoles.map((role) => (
                        <li
                          key={role!.id}
                          onClick={() => toggleAssignedSelection(role!.id)}
                          onDoubleClick={() => {
                            setAssignedRoleIds((prev) => prev.filter((id) => id !== role!.id));
                            setSelectedAssigned((prev) => prev.filter((a) => a !== role!.id));
                          }}
                          className={`px-3 py-1.5 text-sm cursor-pointer select-none flex items-center justify-between gap-1 ${
                            selectedAssigned.includes(role!.id)
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span>{role!.name}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="p-0.5 rounded hover:bg-slate-200 text-muted-foreground hover:text-foreground"
                                aria-label={`View permissions for ${role!.name}`}
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3" side="right" align="start">
                              <p className="text-xs font-semibold mb-1.5">Permissions</p>
                              {role!.actions.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No permissions</p>
                              ) : (
                                <ul className="space-y-0.5">
                                  {role!.actions.map((action) => (
                                    <li key={action} className="text-xs text-muted-foreground">
                                      {action}{actionsMap.get(action)?.is_global && <span className="font-bold italic text-amber-600"> (global)</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </PopoverContent>
                          </Popover>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Info className="mr-1 h-4 w-4" />
                  Show effective permissions
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" side="right" align="start">
                <p className="text-xs font-semibold mb-1.5">
                  Effective permissions ({effectivePermissions.length})
                </p>
                {effectivePermissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No permissions (no roles assigned)</p>
                ) : (
                  <ul className="space-y-0.5 max-h-48 overflow-y-auto">
                    {effectivePermissions.map((action) => (
                      <li key={action} className="text-xs text-muted-foreground">
                        {action}{actionsMap.get(action)?.is_global && <span className="font-bold italic text-amber-600"> (global)</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {effectivePermissions.some((action) => actionsMap.get(action)?.is_global) && (
            <p className="text-xs text-amber-600">
              Some permissions in the assigned roles are global and not limited by scope.
            </p>
          )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-scope">Scope</Label>
            <div className="flex items-center gap-2">
              <Select
                value={scopeId ?? NO_SCOPE_VALUE}
                onValueChange={(value) => setScopeId(value === NO_SCOPE_VALUE ? null : value)}
              >
                <SelectTrigger id="team-scope" className="flex-1">
                  <SelectValue placeholder="Select a scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SCOPE_VALUE}>
                    <span className="italic">Global (no scope)</span>
                  </SelectItem>
                  {(allScopes ?? []).map((scope) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      {scope.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scopeId && (() => {
                const selectedScope = (allScopes ?? []).find((s) => s.id === scopeId);
                if (!selectedScope || Object.keys(selectedScope.attr).length === 0) return null;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="p-0.5 rounded hover:bg-slate-200 text-muted-foreground hover:text-foreground"
                        aria-label="View scope attributes"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" side="right" align="start">
                      <p className="text-xs font-semibold mb-1.5">Scope attributes</p>
                      <ul className="space-y-0.5 max-h-48 overflow-y-auto">
                        {Object.entries(selectedScope.attr).map(([key, value]) => (
                          <li key={key} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{key}:</span>{" "}
                            {Array.isArray(value) ? value.join(", ") : String(value ?? "null")}
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                );
              })()}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateScopeOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                New scope
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ScopeEditDialog
      scope={null}
      open={isCreateScopeOpen}
      onOpenChange={setIsCreateScopeOpen}
      onCreated={(createdScope) => {
        setScopeId(createdScope.id);
      }}
    />

    <RoleEditDialog
      role={null}
      open={isCreateRoleOpen}
      onOpenChange={setIsCreateRoleOpen}
      onCreated={(createdRole) => {
        setAssignedRoleIds((prev) => [...prev, createdRole.id]);
      }}
    />
    </>
  );
}
