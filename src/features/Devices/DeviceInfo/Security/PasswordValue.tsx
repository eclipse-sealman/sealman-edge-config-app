import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert, LoadingState } from "@/components/ui/page-state";
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
      {isError ? <InlineAlert className="mb-3">Error getting password.</InlineAlert> : null}
      {isLoading ? <LoadingState className="p-2" /> : null}
      {!isLoading && !isError && data ? 
      <div className="mb-3 flex flex-row gap-2">
        <Input className="flex-1" type="text" name="password-value" value={data.secretValue} readOnly />
        <Button onClick={handleCopy}>{copied ? "Copied" : "Copy"}</Button>
      </div> : null}
    </div>
  );
}
