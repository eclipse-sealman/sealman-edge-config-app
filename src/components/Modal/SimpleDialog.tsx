import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SimpleDialogProps {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    children: React.ReactNode;
}

export default function SimpleDialog({
  isOpen,
  onClose,
  title,
  children,
}: SimpleDialogProps) {
  // Without onClose the dialog can only be left through its own actions, so the corner close button is hidden.
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent
        className={`max-w-md ${onClose ? "" : "[&>button]:hidden"}`}
        aria-describedby={undefined}
        onInteractOutside={(e) => !onClose && e.preventDefault()}
        onEscapeKeyDown={(e) => !onClose && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {onClose ? (
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
