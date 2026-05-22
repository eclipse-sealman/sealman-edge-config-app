import Button, { ButtonSize } from "../Input/Button";

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
  if (!isOpen) return null;

  return (
    <div role="dialog" className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
        <h2 className="text-lg font-semibold mb-5">{title}</h2>
        {children}
        {onClose ? <><Button size={ButtonSize.Small} onClick={onClose}>Close</Button></> : null}
      </div>
    </div>
  );
}
