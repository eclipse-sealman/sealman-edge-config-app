import { useMemo, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { TrashIcon } from "@heroicons/react/24/outline";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const freshUser = allUsers?.find((u) => u.id === user?.id) ?? user;
  const userTeams = freshUser?.teams ?? [];
  const userTeamIds = new Set(userTeams.map((t) => t.id));

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim() || !allTeams) return [];
    const query = searchQuery.toLowerCase();
    return allTeams
      .filter(
        (t: TeamListItemResponse) =>
          !userTeamIds.has(t.id) &&
          t.name.toLowerCase().includes(query),
      )
      .slice(0, 10);
  }, [searchQuery, allTeams, userTeamIds]);

  const handleAddToTeam = async (teamId: string) => {
    if (!user) return;
    setSearchQuery("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setError(null);
    try {
      await addUserMutation.mutateAsync({ teamId, userId: user.id });
      await queryClient.invalidateQueries({ queryKey: ["authUsers"] });
    } catch (e: unknown) {
      setError(extractErrorMessage(e, "Failed to add user to team"));
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredTeams.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredTeams.length - 1 ? prev + 1 : 0;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredTeams.length - 1;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredTeams.length) {
        handleAddToTeam(filteredTeams[highlightedIndex].id);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const scrollToIndex = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
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
          <div className="relative">
            <Input
              placeholder="Search teams to add..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleSearchKeyDown}
            />
            {showSuggestions && filteredTeams.length > 0 && (
              <ul ref={listRef} className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-white shadow-md">
                {filteredTeams.map((team: TeamListItemResponse, index: number) => (
                  <li
                    key={team.id}
                    onClick={() => handleAddToTeam(team.id)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      index === highlightedIndex
                        ? "bg-blue-100 text-blue-800"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {team.name}
                  </li>
                ))}
              </ul>
            )}
            {showSuggestions && searchQuery.trim() && filteredTeams.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md px-3 py-2 text-sm text-muted-foreground">
                No teams found
              </div>
            )}
          </div>

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
