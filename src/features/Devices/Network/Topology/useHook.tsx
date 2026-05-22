import { useNavigate } from "react-router-dom";

export function useConfirmNavigate(isEditing: boolean, message: string) {
  const navigate = useNavigate();

  return (to: string, options?: { replace?: boolean; state?: unknown }) => {
    if (isEditing) {
      if (window.confirm(message)) {
        navigate(to, options);
      }
      // else: do nothing, stay on page
    } else {
      navigate(to, options);
    }
  };
}