import { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  title: string;
  selectedItems: string[];
  availableItems: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
};

export function TransferList({
  title,
  selectedItems,
  availableItems,
  onAdd,
  onRemove,
}: Props) {
  const [selectedSearch, setSelectedSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");

  const filteredSelected = selectedItems.filter((item) =>
  item.toLowerCase().includes(selectedSearch.toLowerCase().trim())
);

const filteredAvailable = availableItems.filter((item) =>
  item.toLowerCase().includes(availableSearch.toLowerCase().trim())
);

  return (
    <div className="space-y-4">

      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="grid grid-cols-2 gap-6">

        {/* Selected Templates Card */}
        <Card>

          <CardHeader>
            <CardTitle className="text-base">
              Selected Templates
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            <Input
              placeholder="Search selected..."
              value={selectedSearch}
              onChange={(e) => setSelectedSearch(e.target.value)}
            />

            <ScrollArea className="h-60 border rounded-md p-2">

              <div className="space-y-1">

                {filteredSelected.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    <span>{item}</span>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(item)}
                      className="h-6 w-6 text-muted-foreground hover:text-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </Button>

                  </div>
                ))}

                {filteredSelected.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-4">
                    No matching templates
                  </p>
                )}

              </div>

            </ScrollArea>

          </CardContent>

        </Card>

        {/* Available Templates Card */}
        <Card>

          <CardHeader>
            <CardTitle className="text-base">
              Available Templates
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            <Input
              placeholder="Search available..."
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
            />

            <ScrollArea className="h-60 border rounded-md p-2">

              <div className="space-y-1">

                {filteredAvailable.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    <span>{item}</span>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onAdd(item)}
                      className="h-6 w-6 text-muted-foreground hover:text-green-600"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>

                  </div>
                ))}

                {filteredAvailable.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-4">
                    No matching templates
                  </p>
                )}

              </div>

            </ScrollArea>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}
