import { useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FilterOperator, SearchFilter, SearchIndex, SearchKey, SearchScope } from "./deviceSearch";
import { keyId } from "./deviceSearch";

const MAX_VALUE_OPTIONS = 1000;

const SCOPE_LABEL: Record<SearchFilter["scope"], string> = {
  device: "Device",
  endpoint: "Endpoint",
  any: "Any",
};

const SCOPE_CHIP_CLASS: Record<SearchFilter["scope"], string> = {
  device: "",
  endpoint: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-50",
  any: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50",
};

interface DeviceSearchBarProps {
  index: SearchIndex;
  filters: SearchFilter[];
  onChange: (filters: SearchFilter[]) => void;
  className?: string;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function DeviceSearchBar({ index, filters, onChange, className }: DeviceSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<SearchKey | null>(null);
  const [search, setSearch] = useState("");

  const trimmedSearch = search.trim();

  const resetPicker = () => {
    setSelectedKey(null);
    setSearch("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetPicker();
  };

  const addFilter = (filter: Omit<SearchFilter, "id">) => {
    const duplicate = filters.some(
      (existing) =>
        existing.scope === filter.scope &&
        existing.key === filter.key &&
        existing.operator === filter.operator &&
        existing.value.toLowerCase() === filter.value.toLowerCase(),
    );
    if (!duplicate) onChange([...filters, { ...filter, id: newId() }]);
    handleOpenChange(false);
  };

  const addValueFilter = (key: SearchKey, operator: FilterOperator, value: string) =>
    addFilter({ scope: key.scope, key: key.key, label: key.label, operator, value });

  const keysByScope = (scope: SearchScope) => index.keys.filter((key) => key.scope === scope);

  const valueOptions = selectedKey ? (index.valuesByKeyId[selectedKey.id] ?? []) : [];
  const hasExactValue = valueOptions.some((option) => option.value.toLowerCase() === trimmedSearch.toLowerCase());

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-sm",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className={cn("max-w-full gap-1 py-0.5 pr-1 font-normal", SCOPE_CHIP_CLASS[filter.scope])}
        >
          <span className="text-[10px] font-semibold uppercase opacity-60">{SCOPE_LABEL[filter.scope]}</span>
          {filter.scope !== "any" && <span className="font-medium">{filter.label}</span>}
          {filter.scope !== "any" && <span className="opacity-60">{filter.operator === "is" ? "=" : "~"}</span>}
          <span className="truncate">{filter.scope === "any" ? `"${filter.value}"` : filter.value}</span>
          <button
            type="button"
            aria-label={`Remove filter ${filter.label} ${filter.value}`}
            className="rounded-sm p-0.5 opacity-60 hover:bg-black/10 hover:opacity-100"
            onClick={() => onChange(filters.filter((existing) => existing.id !== filter.id))}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="min-w-32 flex-1 py-1 text-left text-muted-foreground hover:text-foreground"
          >
            {filters.length === 0 ? "Search devices and endpoints, or filter by field..." : "Add filter..."}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(30rem,90vw)] p-0">
          <Command>
            <CommandInput
              autoFocus
              placeholder={selectedKey ? `Search values of ${selectedKey.label}...` : "Search fields or type text..."}
              value={search}
              onValueChange={setSearch}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && search === "" && selectedKey) resetPicker();
              }}
            />
            <CommandList className="max-h-80">
              {selectedKey ? (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent"
                    onClick={resetPicker}
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>
                      {SCOPE_LABEL[selectedKey.scope]} · <span className="font-medium text-foreground">{selectedKey.label}</span>
                    </span>
                  </button>
                  <CommandEmpty>No matching values.</CommandEmpty>
                  <CommandGroup>
                    {valueOptions.slice(0, MAX_VALUE_OPTIONS).map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => addValueFilter(selectedKey, "is", option.value)}
                      >
                        <span className="truncate">{option.value}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{option.count}</span>
                      </CommandItem>
                    ))}
                    {trimmedSearch !== "" && !hasExactValue && (
                      <CommandItem
                        forceMount
                        value={`__contains__ ${trimmedSearch}`}
                        onSelect={() => addValueFilter(selectedKey, "contains", trimmedSearch)}
                      >
                        Contains "{trimmedSearch}"
                      </CommandItem>
                    )}
                  </CommandGroup>
                </>
              ) : (
                <>
                  <CommandEmpty>No matching fields.</CommandEmpty>
                  {trimmedSearch !== "" && (
                    <CommandGroup>
                      <CommandItem
                        forceMount
                        value={`__text__ ${trimmedSearch}`}
                        onSelect={() =>
                          addFilter({ scope: "any", key: "*", label: "Any", operator: "contains", value: trimmedSearch })
                        }
                      >
                        <Search />
                        Search all fields for "{trimmedSearch}"
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {(["device", "endpoint"] as const).map((scope) =>
                    keysByScope(scope).length === 0 ? null : (
                    <CommandGroup key={scope} heading={`${SCOPE_LABEL[scope]} fields`}>
                      {keysByScope(scope).map((key) => (
                        <CommandItem
                          key={key.id}
                          value={`${SCOPE_LABEL[scope]} ${key.label} ${key.key}`}
                          onSelect={() => {
                            setSelectedKey(key);
                            setSearch("");
                          }}
                        >
                          <span className="truncate">{key.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {index.valuesByKeyId[keyId(key.scope, key.key)]?.length ?? 0} values
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    ),
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {filters.length > 0 && (
        <button
          type="button"
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onChange([])}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
