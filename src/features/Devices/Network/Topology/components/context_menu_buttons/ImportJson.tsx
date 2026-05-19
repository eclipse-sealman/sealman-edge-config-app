import { useCallback } from "react";
import { useTopologyStore, useMenuStore } from "../../stores";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";

export default function ImportJson() {
  const setNodes = useTopologyStore((state) => state.setNodes);
  const setEdges = useTopologyStore((state) => state.setEdges);
  const setMenu = useMenuStore((state) => state.setMenuProps);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const topology = JSON.parse(e.target?.result as string);
          if (topology.nodes && topology.edges) {
            setNodes(topology.nodes);
            setEdges(topology.edges);
            setMenu(null); // Close the menu after import
            console.log("Imported topology:", topology);
          } else {
            alert("Invalid JSON format. Please provide a valid topology file.");
          }
        } catch (error) {
          alert("Error parsing JSON file. Please check the file format. Error: " + error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges, setMenu]);

  return (
    <Button variant="ghost" onClick={handleImport} className="flex w-full justify-start items-center gap-2">
      <UploadIcon />
      Import JSON
    </Button>
  );
}