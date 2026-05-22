import { Column } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import DebouncedInput from "../Input/DebouncedInput";

interface FilterProps {
  column: Column<any, unknown>;
}

export default function Filter({ column }: FilterProps) {
  const columnFilterValue = column.getFilterValue();

  const uniqueValues = column.getFacetedUniqueValues();

  const sortedUniqueValues = useMemo(
    () =>
      Array.from(uniqueValues.keys())
        .filter((v) => v !== null && v !== undefined)
        .sort()
        .slice(0, 5000),
    [uniqueValues]
  );

  const onValueChange = useCallback(
    (value: string | number) => column.setFilterValue(value),
    [column]
  );

  return (
    <>
      {/* Autocomplete suggestions from faceted values feature */}
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.map((value: any) => (
          <option value={value} key={value} />
        ))}
      </datalist>
      <DebouncedInput
        className="text-xs text-black -my-1 p-1 h-6"
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={onValueChange}
        placeholder={`Search... (${uniqueValues.size})`}
        list={column.id + "list"}
      />
    </>
  );
}
