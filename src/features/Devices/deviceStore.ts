import createSelectors from "@/utils/zustandSelectors";
import { ColumnFiltersState } from "@tanstack/react-table";
import { create } from "zustand";

interface DeviceStore {
  globalFilter: string;
  setGlobalFilter: (filterValue: string) => void;

  columnFilters: ColumnFiltersState;
  setColumnFilters: (columnFilters: ColumnFiltersState) => void;
}

const useDeviceStore = create<DeviceStore>()((set) => ({
  globalFilter: "",
  setGlobalFilter: (filterValue: string) => set({ globalFilter: filterValue }),
  columnFilters: [],
  setColumnFilters: (columnFilters: ColumnFiltersState) => set({ columnFilters: columnFilters }),
}));

export default createSelectors(useDeviceStore);
