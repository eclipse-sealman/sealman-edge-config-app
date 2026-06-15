import { useMemo, useRef, useState } from "react";
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
import { TrashIcon } from "@heroicons/react/24/outline";
import type { components } from "@/generated/edge-administration/types";

type TeamListItemResponse = components["schemas"]["TeamListItemResponse"];
type UserSummaryResponse = components["schemas"]["UserSummaryResponse"];

type TeamMembersDialogProps = {
  team: TeamListItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeamMembersDialog({ team, open, onOpenChange }: TeamMembersDialogProps) {
  const { data: teamDetails, isLoading } = edgeConfigApiHooks.useGetTeamDetails(
    team?.id,
    open && Boolean(team),
  );
  const { data: allUsers } = edgeConfigApiHooks.useGetUsers();
  const addUserMutation = edgeConfigApiHooks.useAddUserToTeam();
  const removeUserMutation = edgeConfigApiHooks.useRemoveUserFromTeam();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const members: UserSummaryResponse[] = teamDetails?.users ?? [];
  const memberIds = new Set(members.map((u) => u.id));

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim() || !allUsers) return [];
    const query = searchQuery.toLowerCase();
    return allUsers
      .filter(
        (u) =>
          !memberIds.has(u.id) &&
          u.preferred_username.toLowerCase().includes(query),
      )
      .slice(0, 10);
  }, [searchQuery, allUsers, memberIds]);

  const handleAddUser = async (userId: string) => {
    if (!team) return;
    setSearchQuery("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    await addUserMutation.mutateAsync({ teamId: team.id, userId });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredUsers.length - 1 ? prev + 1 : 0;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredUsers.length - 1;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredUsers.length) {
        handleAddUser(filteredUsers[highlightedIndex].id);
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

  const handleRemoveUser = async (userId: string) => {
    if (!team) return;
    await removeUserMutation.mutateAsync({ teamId: team.id, userId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Members — {team?.name}</DialogTitle>
          <DialogDescription>
            Manage users assigned to this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search / add user */}
          <div className="relative">
            <Input
              placeholder="Search users to add..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleSearchKeyDown}
            />
            {showSuggestions && filteredUsers.length > 0 && (
              <ul ref={listRef} className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-white shadow-md">
                {filteredUsers.map((user, index) => (
                  <li
                    key={user.id}
                    onClick={() => handleAddUser(user.id)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      index === highlightedIndex
                        ? "bg-blue-100 text-blue-800"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {user.preferred_username}
                  </li>
                ))}
              </ul>
            )}
            {showSuggestions && searchQuery.trim() && filteredUsers.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md px-3 py-2 text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>

          {/* Members list */}
          <div className="border rounded-md max-h-64 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">No members</p>
            ) : (
              <ul className="divide-y">
                {members.map((user) => (
                  <li key={user.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm">{user.preferred_username}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveUser(user.id)}
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
