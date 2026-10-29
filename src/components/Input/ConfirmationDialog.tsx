import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfirmationDialogProps {
  confirmationText: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "info" | "warning" | "error"
}

const ICONS = {
  info: { Icon: InformationCircleIcon, color: 'text-blue-500' },
  warning: { Icon: ExclamationCircleIcon, color: 'text-yellow-500' },
  error: { Icon: ExclamationCircleIcon, color: 'text-red-500' },
} as const;

export default function ConfirmationDialog({ confirmationText, isOpen, onClose, onConfirm, type = "info" }: ConfirmationDialogProps) {
  const { Icon, color } = ICONS[type];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader className="items-center">
          <Icon className={`h-8 w-8 ${color}`} />
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>{confirmationText}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-center sm:space-x-0">
          <Button onClick={onConfirm}>OK</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
