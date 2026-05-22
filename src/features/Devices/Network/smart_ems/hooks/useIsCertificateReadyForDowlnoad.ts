import { UserCertificate } from "../services/smartems/hooks";

export function useIsCertificateReadyForDownload(userCertificate?: UserCertificate) {
  if (!userCertificate) {
    return false;
  }

  if (!Array.isArray(userCertificate.useableCertificates)) {
    return false;
  }

  const isCertificateUseable = userCertificate.useableCertificates.length > 0;
  if (!isCertificateUseable) {
    return false;
  }

  const isCertificateGenerated = userCertificate.useableCertificates[0].certificate?.hasCertificate;
  if (!isCertificateGenerated) {
    return false;
  }

  const isTechnicianCertificate =
    userCertificate.useableCertificates[0].certificate?.certificateType?.certificateCategory ===
    "technicianVpn";

  if (!isTechnicianCertificate) {
    return false;
  }

  const validTo = userCertificate.useableCertificates[0].certificate?.certificateValidTo;
  if (validTo == undefined) {
    return false;
  }

  try {
    const isCertificateExpired = new Date(validTo) < new Date();

    if (isCertificateExpired) {
      return false;
    }
  } catch (err) {
    console.error("Certificate validTo couldn't be parse as Date", { err });
  }

  return true;
}
