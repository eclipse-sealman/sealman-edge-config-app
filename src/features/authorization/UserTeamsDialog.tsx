import { useMemo, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ChevronsUpDown } from "lucide-react";
import type { components } from "@/generated/edge-administration/types";

type UserWithTeamsResponse = components["schemas"]["UserWithTeamsResponse"];
type TeamListItemResponse = components["schemas"]["TeamListItemResponse"];

type UserTeamsDialogProps = {
  user: UserWithTeamsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function extractErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object") {
    const err = e as any;
    if (typeof err.response?.data?.message === "string") return err.response.data.message;
    if (typeof err.response?.data?.detail === "string") return err.response.data.detail;
    if (err.response?.statusText) return `${err.response.status}: ${err.response.statusText}`;
    if (typeof err.message === "string") return err.message;
  } else if (typeof e === "string") {
    return e;
  }
  return fallback;
}

export function UserTeamsDialog({ user, open, onOpenChange }: UserTeamsDialogProps) {
  const { data: allUsers } = edgeConfigApiHooks.useGetUsers();
  const { data: allTeams } = edgeConfigApiHooks.useGetTeams();
  const addUserMutation = edgeConfigApiHooks.useAddUserToTeam();
  const removeUserMutation = edgeConfigApiHooks.useRemoveUserFromTeam();
  const queryClient = useQueryClient();

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freshUser = allUsers?.find((u) => u.id === user?.id) ?? user;
  const userTeams = freshUser?.teams ?? [];
  const userTeamIds = new Set(userTeams.map((t) => t.id));

  const availableTeams = useMemo(() => {
    if (!allTeams) return [];
    return allTeams.filter((t: TeamListItemResponse) => !userTeamIds.has(t.id));
  }, [allTeams, userTeamIds]);

  const handleAddToTeam = async (teamId: string) => {
    if (!user) return;
    setComboboxOpen(false);
    setError(null);
    try {
      await addUserMutation.mutateAsync({ teamId, userId: user.id });
      await queryClient.invalidateQueries({ queryKey: ["authUsers"] });
    } catch (e: unknown) {
      setError(extractErrorMessage(e, "Failed to add user to team"));
    }
  };

  const handleRemoveFromTeam = async (teamId: string) => {
    if (!user) return;
    setError(null);
    try {
      await removeUserMutation.mutateAsync({ teamId, userId: user.id });
      await queryClient.invalidateQueries({ queryKey: ["authUsers"] });
    } catch (e: unknown) {
      setError(extractErrorMessage(e, "Failed to remove user from team"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Teams — {user?.preferred_username}</DialogTitle>
          <DialogDescription>
            Manage teams assigned to this user.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-4 py-2">
          {/* Search / add team */}
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-full justify-between"
              >
                Select a team to add...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
              <Command>
                <CommandInput placeholder="Search teams..." />
                <CommandList onWheel={(e) => e.stopPropagation()}>
                  <CommandEmpty>No teams found</CommandEmpty>
                  {availableTeams.map((team: TeamListItemResponse) => (
                    <CommandItem
                      key={team.id}
                      value={team.name}
                      onSelect={() => handleAddToTeam(team.id)}
                    >
                      {team.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Teams list */}
          <div className="border rounded-md max-h-64 overflow-y-auto">
            {userTeams.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">No teams</p>
            ) : (
              <ul className="divide-y">
                {userTeams.map((team) => (
                  <li key={team.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm">{team.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveFromTeam(team.id)}
                      disabled={removeUserMutation.isPending}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
