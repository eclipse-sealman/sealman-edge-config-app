import { create } from "zustand"
import { ContextMenuProps } from "../layouts/context_menu/ContextMenuLayout"

interface MenuStore {
  menuProps: ContextMenuProps | null,
  setMenuProps: (props: ContextMenuProps | null) => void,
  selectedMachineType: string,
  setSelectedMachineType: (s: string) => void,
  selectedIsolatedEndpointType: string,
  setSelectedIsolatedEndpointType: (s: string) => void,
}

export default create<MenuStore>(set => ({
  menuProps: null,
  setMenuProps: (menuProps) => set({ menuProps }),
  selectedMachineType: "",
  setSelectedMachineType: (selectedMachineType) => set({selectedMachineType}),
  selectedIsolatedEndpointType: "",
  setSelectedIsolatedEndpointType: (selectedIsolatedEndpointType) => set({selectedIsolatedEndpointType}),
}))
