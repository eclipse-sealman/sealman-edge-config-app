import { useCallback } from "react";
import { useTopologyStore, useMenuStore } from "../../stores";
import { Button } from "@/components/ui/button";
import { EditIcon } from "lucide-react";

export default function EditTopologyContextMenu() {
  const setMenu = useMenuStore((state) => state.setMenuProps);

  const setIsEditing = useTopologyStore((state) => state.setIsEditing)

  const handleEdit = useCallback(
    async () => {
      setIsEditing(true);
      setMenu(null); // Close the menu after saving
    },
    [setIsEditing, setMenu]
  );

  return (
    <Button variant="ghost" onClick={handleEdit} className="flex w-full justify-start items-center gap-2">
      <EditIcon />
      Edit
    </Button>
  );
}