import { toast } from "react-toastify";

export function useClipboardCopy() {
 const copy = async (textToCopy: string, notification?: string) => {
   try {
     await navigator.clipboard.writeText(textToCopy);
     toast.success(notification ?? "Copied to your clipboard")
   } catch (err) {
     console.error('Failed to copy to clipboard:', err);
     toast.error("Failed to copy to clipboard")
   }
 }

  return {
    copy
  }
}
