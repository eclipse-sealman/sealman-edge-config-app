import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBrowser } from "@/lib/browserRegistry";

interface props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: string | null;
  ip: string;
  port: number;
}

export default function BrowseDialog({ open, onOpenChange, kind, ip, port }: props) {
  const registration = kind ? getBrowser(kind) : undefined;
  const BrowserComponent = registration?.component;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {registration?.label ?? "Browse"} — {ip}:{port}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {BrowserComponent ? (
            <BrowserComponent ip={ip} port={port} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No browser is registered for "{kind}". Use registerBrowser() to add one.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
