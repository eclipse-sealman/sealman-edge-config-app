import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type NewUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewUserDialog({ open, onOpenChange }: NewUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Access Pending</DialogTitle>
          <DialogDescription>
            Your account has been registered successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <p>
            You have not been assigned to any team yet, so you currently don't
            have any permissions in this application.
          </p>
          <p className="text-muted-foreground">
            Please contact an administrator to get team and role assignments.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
