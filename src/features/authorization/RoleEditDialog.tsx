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
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { components } from "@/generated/edge-administration/types";

type RoleResponse = components["schemas"]["RoleResponse"];

type RoleEditDialogProps = {
  role: RoleResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoleEditDialog({ role, open, onOpenChange }: RoleEditDialogProps) {
  const createRoleMutation = edgeConfigApiHooks.useCreateRole();
  const updateRoleMutation = edgeConfigApiHooks.useUpdateRole();
  const { data: allActions } = edgeConfigApiHooks.useGetActions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedActions, setAssignedActions] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(role);
  const isSaving =
    createRoleMutation.isPending ||
    updateRoleMutation.isPending;

  const availableActionNames = (allActions ?? [])
    .map((a) => a.name)
    .filter((name) => !assignedActions.includes(name))
    .sort();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (role) {
      setName(role.name);
      setDescription(role.description ?? "");
      setAssignedActions([...role.actions]);
    } else {
      setName("");
      setDescription("");
      setAssignedActions([]);
    }

    setSelectedAvailable([]);
    setSelectedAssigned([]);
    setError(null);
  }, [open, role]);

  const moveToAssigned = () => {
    if (selectedAvailable.length === 0) return;
    setAssignedActions((prev) => [...prev, ...selectedAvailable].sort());
    setSelectedAvailable([]);
  };

  const moveToAvailable = () => {
    if (selectedAssigned.length === 0) return;
    setAssignedActions((prev) => prev.filter((a) => !selectedAssigned.includes(a)));
    setSelectedAssigned([]);
  };

  const moveAllToAssigned = () => {
    setAssignedActions((prev) => [...prev, ...availableActionNames].sort());
    setSelectedAvailable([]);
  };

  const moveAllToAvailable = () => {
    setAssignedActions([]);
    setSelectedAssigned([]);
  };

  const toggleAvailableSelection = (action: string) => {
    setSelectedAvailable((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action],
    );
  };

  const toggleAssignedSelection = (action: string) => {
    setSelectedAssigned((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action],
    );
  };

  const handleSave = async () => {
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    if (assignedActions.length === 0) {
      setError("At least one action must be assigned");
      return;
    }

    try {
      const descriptionValue = description.trim() || null;

      if (role) {
        await updateRoleMutation.mutateAsync({
          roleId: role.id,
          payload: { name: trimmedName, description: descriptionValue, actions: assignedActions },
        });
      } else {
        await createRoleMutation.mutateAsync({
          name: trimmedName,
          description: descriptionValue,
          actions: assignedActions,
        });
      }

      onOpenChange(false);
    } catch (e: unknown) {
      let message = "Failed to save role";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the role name, description, and assigned actions."
              : "Set role name, description, and assign actions."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Role name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Role description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="flex items-stretch gap-2">
              {/* Available actions */}
              <div className="flex-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground mb-1">Available</p>
                <div className="border rounded-md h-52 overflow-y-auto bg-white">
                  {availableActionNames.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      No available actions
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {availableActionNames.map((action) => (
                        <li
                          key={action}
                          onClick={() => toggleAvailableSelection(action)}
                          onDoubleClick={() => {
                            setAssignedActions((prev) => [...prev, action].sort());
                            setSelectedAvailable((prev) => prev.filter((a) => a !== action));
                          }}
                          className={`px-3 py-1.5 text-sm cursor-pointer select-none ${
                            selectedAvailable.includes(action)
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {action}
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
                  disabled={availableActionNames.length === 0}
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
                  disabled={assignedActions.length === 0}
                  title="Move all to available"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Assigned actions */}
              <div className="flex-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground mb-1">Assigned</p>
                <div className="border rounded-md h-52 overflow-y-auto bg-white">
                  {assignedActions.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      No assigned actions
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {[...assignedActions].sort().map((action) => (
                        <li
                          key={action}
                          onClick={() => toggleAssignedSelection(action)}
                          onDoubleClick={() => {
                            setAssignedActions((prev) => prev.filter((a) => a !== action));
                            setSelectedAssigned((prev) => prev.filter((a) => a !== action));
                          }}
                          className={`px-3 py-1.5 text-sm cursor-pointer select-none ${
                            selectedAssigned.includes(action)
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {action}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
  );
}
