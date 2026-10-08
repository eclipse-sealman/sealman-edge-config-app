import createSelectors from "@/utils/zustandSelectors";
import { ColumnFiltersState } from "@tanstack/react-table";
import { create } from "zustand";
import type { SearchFilter } from "./search/deviceSearch";

interface DeviceStore {
  searchFilters: SearchFilter[];
  setSearchFilters: (filters: SearchFilter[]) => void;

  columnFilters: ColumnFiltersState;
  setColumnFilters: (columnFilters: ColumnFiltersState) => void;
}

const useDeviceStore = create<DeviceStore>()((set) => ({
  searchFilters: [],
  setSearchFilters: (filters: SearchFilter[]) => set({ searchFilters: filters }),
  columnFilters: [],
  setColumnFilters: (columnFilters: ColumnFiltersState) => set({ columnFilters: columnFilters }),
}));

export default createSelectors(useDeviceStore);
