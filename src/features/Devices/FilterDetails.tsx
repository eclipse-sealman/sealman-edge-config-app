import Button, { ButtonSize } from "../../components/Input/Button";
import Badge, { BadgeColor } from "../../components/Typography/Badge";

interface FilterDetailsProps {
  totalRows: number;
  filteredRows: number;
  clearTableFilter: () => void;
  className?: string;
}

export default function FilterDetails({ totalRows, filteredRows, clearTableFilter, className }: FilterDetailsProps) {
  return (
    <>
      {totalRows !== filteredRows ? (
        <div className={`flex flex-row gap-2 ${className}`}>
          <Button size={ButtonSize.Tiny} className="flex-0" onClick={clearTableFilter}>
            Clear filter
          </Button>
          <Badge color={BadgeColor.Gray} className="flex-0">
            Filtered {filteredRows} of {totalRows} devices
          </Badge>
        </div>
      ) : null}
    </>
  );
}
