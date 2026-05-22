import { toast } from "react-toastify";
import ButtonWithLoading from "../../../components/buttons/ButtonWithLoading";
import { useDownloadOpenVpnConfig, useGetUserId } from "../../services/smartems/hooks";

export function DownloadOpenVPNConfiguration() {
  const { id } = useGetUserId();
  const { mutateAsync, isPending } = useDownloadOpenVpnConfig()

  const handleOnClick = async ( ) => {
    if (!id) {
      return
    }

    try {
      await mutateAsync()
    } catch (err) {
      console.error(err)
      toast.error("Couldn't download certificate")
    }
  }

  return (
    <ButtonWithLoading
      handleOnClick={handleOnClick }
      isLoading={isPending}
      text="Download OpenVPN configuration"
    />
  )
}
