
import { Button } from "@/components/ui/button";
import { useMenuStore, useTopologyStore } from "../../stores";
import { Trash2 } from "lucide-react";

export default function ClearTopology() {
  const setNodes = useTopologyStore((state) => state.setNodes);
  const setEdges = useTopologyStore((state) => state.setEdges);
  const setMenu = useMenuStore((state) => state.setMenuProps);

  const handleClear = () => {
    setNodes([])
    setEdges([])
    setMenu(null)
  };

  return (
    <Button variant="ghost" onClick={handleClear} className="flex w-full justify-start items-center gap-2 hover:text-destructive hover:bg-red-100">
      <Trash2 />
      Clear
    </Button>
  );
}