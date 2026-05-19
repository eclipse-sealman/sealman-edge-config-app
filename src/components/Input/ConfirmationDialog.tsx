import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface ConfirmationDialogProps {
    confirmationText: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    type: "info"| "warning" | "error"
  }
  
  
  export default function ConfirmationDialog ({ confirmationText, isOpen, onClose, onConfirm , type="info"}: ConfirmationDialogProps){

    if (!isOpen) return null;

    let IconComponent;
    let iconColor;

    switch (type) {
        case 'info':
        IconComponent = InformationCircleIcon;
        iconColor = 'text-blue-500';
        break;
        case 'warning':
        IconComponent = ExclamationCircleIcon;
        iconColor = 'text-yellow-500'; 
        break;
        case 'error':
        IconComponent = ExclamationCircleIcon;
        iconColor = 'text-red-500';
        break;
        default:
        return null;
    }
  
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <div className={`shrink-0 ${iconColor}`}>
            <IconComponent className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold">Confirmation</h2>
          <p className="mt-4">{confirmationText}</p>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };