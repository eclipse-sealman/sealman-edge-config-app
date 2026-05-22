import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadOpenVPNConfiguration } from "../components/config/DownloadCertificate";
import { Alert } from "../components/Alert";
import { Button } from "@/components/ui/button";
import { useIsUserAuthenticated, useListUserCertificate } from "../services/smartems/hooks";
import { useIsCertificateReadyForDownload } from "../hooks/useIsCertificateReadyForDowlnoad";

export function OpenVpn() {
  const { isAuthenticated } = useIsUserAuthenticated();
  const { data } = useListUserCertificate();
  const hasCertificate = useIsCertificateReadyForDownload(data);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>OpenVpn</CardTitle>
      </CardHeader>
      <CardContent className="grow space-y-4">
        {!isAuthenticated && (
          <Alert title="Unauthorized">
            <p>You must authorize Edge Config to use Smart EMS on your behalf first.</p>
          </Alert>
        )}
        {isAuthenticated && (
          <>
            {!hasCertificate && (
              <div>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Your SMART ems user doesn't have a valid technician certificate.
                  </p>
                  <p className="text-orange-500">
                    Please contact your division administrator if you think you should have one.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button disabled className="w-full sm:w-auto">
                    Download OpenVPN configuration
                  </Button>
                </div>
              </div>
            )}
            {hasCertificate && (
              <div>
                <p className="text-sm text-muted-foreground">
                  To connect to the SMART EMS VPN using the Open VPN client, you must first save your Open VPN
                  configuration on your machine. You must use this configuration with the OpenVPN Connect
                  client to authenticate your connection for establishing a secure link to your endpoints.
                </p>
                <div className="flex justify-end">
                  <DownloadOpenVPNConfiguration />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
