import { useCallback } from "react";
import { useTopologyStore, useMenuStore } from "../../stores";
import { Button } from "@/components/ui/button";
import { UndoIcon } from "lucide-react";

export default function AbortEditTopology() {
  const setMenu = useMenuStore((state) => state.setMenuProps);
  const abortEditing = useTopologyStore((state) => state.abortEditing)

  const handleAbortEdit = useCallback(
    async () => {
      abortEditing();
      setMenu(null); // Close the menu after aborting
    },
    [abortEditing, setMenu]
  );

  return (
    <Button variant="ghost" onClick={handleAbortEdit} className="flex w-full justify-start items-center gap-2 hover:text-destructive hover:bg-red-100">
      <UndoIcon />
      Abort
    </Button>
  );
}