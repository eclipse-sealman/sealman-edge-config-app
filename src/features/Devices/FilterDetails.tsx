import Button, { ButtonSize } from "../../components/Input/Button";
import Badge, { BadgeColor } from "../../components/Typography/Badge";

interface FilterDetailsProps {
  totalRows: number;
  filteredRows: number;
  // Optional: pages with a search bar clear it via the bar's own "x" instead of this button -
  // pages with other kinds of filters (e.g. the dashboard map's country/online-status filters,
  // which have no search bar to attach a clear affordance to) still pass this in.
  clearTableFilter?: () => void;
  className?: string;
}

export default function FilterDetails({ totalRows, filteredRows, clearTableFilter, className }: FilterDetailsProps) {
  return (
    <>
      {totalRows !== filteredRows ? (
        <div className={`flex flex-row gap-2 ${className}`}>
          {clearTableFilter && (
            <Button size={ButtonSize.Tiny} className="flex-0" onClick={clearTableFilter}>
              Clear filter
            </Button>
          )}
          <Badge color={BadgeColor.Gray} className="flex-0">
            Filtered {filteredRows} of {totalRows} devices
          </Badge>
        </div>
      ) : null}
    </>
  );
}
