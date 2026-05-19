import { Unlink } from "lucide-react";
import { useLogout } from "../../services/smartems/auth/useAuth";
import ButtonWithLoading from "../../../components/buttons/ButtonWithLoading";

export function DisconnectSmartEMS() {
  const { mutateAsync, isPending } = useLogout()

  return (
    <div className="sm:text-right">
      <ButtonWithLoading
        variant="destructive"
        handleOnClick={async () => {
          mutateAsync()
        }}
        isLoading={ isPending }
      >
        <Unlink /> Disconnect SMART EMS
      </ButtonWithLoading>
    </div>
  );
}
