import { AddIsolatedEndpoint } from "./AddEndpointDialog";
import { AddMachine } from "./AddMachineDialog";
import ClearTopology from "../../components/context_menu_buttons/ClearTopology";
import ExportJson from "../../components/context_menu_buttons/ExportJson";
import ImportJson from "../../components/context_menu_buttons/ImportJson";
import SaveTopologyContextMenu from "../../components/context_menu_buttons/Save";
import { useTopologyStore } from "../../stores";
import EditTopologyContextMenu from "../../components/context_menu_buttons/Edit";
import AbortEditTopology from "../../components/context_menu_buttons/Abort";

export interface ContextMenuProps {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

export default function ContextMenu({ top, left, right, bottom }: ContextMenuProps) {
  const isEditing = useTopologyStore((state) => state.isEditing)

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-300 rounded shadow-lg"
      style={{ top, left, right, bottom }}
    >
      <div className="flex flex-col">
        { isEditing && (
          <>
            <AddMachine />
            <AddIsolatedEndpoint />
            <ClearTopology />
            <ImportJson />
            <ExportJson />
            <SaveTopologyContextMenu />
            <AbortEditTopology />
          </>
        )}
        { !isEditing && (
          <>
            <EditTopologyContextMenu />
            <ExportJson />
          </>
        )}
      </div>
    </div>
  );
}