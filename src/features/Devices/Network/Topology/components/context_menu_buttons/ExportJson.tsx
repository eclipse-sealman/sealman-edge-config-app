import { useCallback } from "react";
import { useTopologyStore, useMenuStore } from "../../stores";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export default function ExportJson() {
  const nodes = useTopologyStore((state) => state.nodes);
  const edges = useTopologyStore((state) => state.edges);
  const setMenu = useMenuStore((state) => state.setMenuProps);

  const handleExport = useCallback(() => {
    const topology = {
      nodes,
      edges,
    };
    const json = JSON.stringify(topology, null, 2); // Pretty-print JSON
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(new Blob([blob]));
    link.href = url;
    link.download = "topology.json";
    document.body.appendChild(link);
    
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setMenu(null); // Close the menu after export
  }, [nodes, edges, setMenu]);

  return (
    <Button variant="ghost" onClick={handleExport} className="flex w-full justify-start items-center gap-2">
      <DownloadIcon />
      Export JSON
    </Button>
  );
}