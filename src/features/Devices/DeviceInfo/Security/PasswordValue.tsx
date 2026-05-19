import Button from "@/components/Input/Button";
import { Input } from "@/components/Input/FormElements";
import usePostDeviceRequestPassword from "@/generated/edge-administration/hooks/usePostDeviceRequestPassword";
import { useState } from "react";

export interface PasswordValueProps {
  deviceId: string;
}

export default function PasswordValue({ deviceId }: PasswordValueProps) {
  const { data, isLoading, isError } = usePostDeviceRequestPassword(deviceId);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data?.secretValue) {
      navigator.clipboard.writeText(data.secretValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    }
  };

  return (
    <div className="pt-4 pb-4">
      {isError ? <div className="mb-3 text-red-600 ">Error getting password.</div> : null}
      {isLoading ? <div className="mb-3">Loading...</div> : null}
      {!isLoading && !isError && data ? 
      <div className="mb-3 flex flex-row gap-2">
        <Input className="flex-1" type="text" name="password-value" value={data.secretValue} readOnly />
        <Button className="flex-0" onClick={handleCopy}>{copied ? "Copied" : "Copy"}</Button>
      </div> : null}
    </div>
  );
}
