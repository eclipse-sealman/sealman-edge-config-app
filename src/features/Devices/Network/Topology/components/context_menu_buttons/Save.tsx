import { useCallback } from "react";
import { useTopologyStore, useMenuStore } from "../../stores";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { usePostLine } from "@/generated/edge-administration/hooks/machine_topology/usePostLine";
import { useNetworkPageStore } from "../../../stores";
import { reactFlowToLine } from "../../mapping_functions";
import { useUpdateLine } from "@/generated/edge-administration/hooks/machine_topology/useUpdateLine";
import { useDeleteLine } from "@/generated/edge-administration/hooks/machine_topology/useDeleteLine";

export default function SaveTopologyContextMenu() {
  const deviceId = useNetworkPageStore((state) => state.deviceId);

  const nodes = useTopologyStore((state) => state.nodes);
  const edges = useTopologyStore((state) => state.edges);
  const isNewTopology = useTopologyStore((state) => state.isNewTopology);
  const setIsNewTopology = useTopologyStore((state) => state.setIsNewTopology);
  const lineNumber = useTopologyStore((state) => state.lineNumber);

  const { postLine } = usePostLine();
  const { updateLine } = useUpdateLine();
  const { deleteLine } = useDeleteLine();
  const setMenu = useMenuStore((state) => state.setMenuProps);
  const setIsEditing = useTopologyStore((state) => state.setIsEditing)

  const handleSave = useCallback(
    async () => {
      if (nodes.length === 0 && !lineNumber) {
        await deleteLine({ deviceId });
        setIsNewTopology(true);
        return;
      }

      const topology = {
        nodes,
        edges,
      };
      const postData = {
        ...reactFlowToLine(topology),
        lineNumber: lineNumber || undefined,
        edgeDeviceId: deviceId,
        name: deviceId, // Currently using deviceId as name. Not editable in UI.
      }
      if (isNewTopology) {
        await postLine({ deviceId, body: postData });
      } else {
        await updateLine({ deviceId, body: postData });
      }

      setIsNewTopology(false);
      setMenu(null); // Close the menu after saving
      setIsEditing(false);
    },
    [nodes, edges, deviceId, isNewTopology, lineNumber, setIsNewTopology, setMenu, setIsEditing, deleteLine, postLine, updateLine]
  );

  return (
    <Button variant="ghost" onClick={handleSave} className="flex w-full justify-start items-center gap-2">
      <SaveIcon />
      Save
    </Button>
  );
}