import { create } from "zustand";

export interface DisplayTopologyStore {
  displayTopology: boolean;
  setDisplayTopology: (v: boolean) => void;
}

export default create<DisplayTopologyStore>(set => ({
  displayTopology: false,
  setDisplayTopology: (v: boolean) => set({ displayTopology: v }),
}))
