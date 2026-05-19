import { create } from "zustand"

interface EndpointSearchStore {
  search: string,
  setSearch: (s: string) => void
}

export default create<EndpointSearchStore>(set => ({
  search: "",
  setSearch: (search) => set({search})
}))
