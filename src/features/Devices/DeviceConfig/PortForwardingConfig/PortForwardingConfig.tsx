import { Heading } from "@/components/Typography/Heading";
import { usePortForwardingConfig } from "./useContext";
import PortForwardingRules from "./PortForwardingRules";
import Button from "@/components/Input/Button";
import { PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";


export default function PortForwardingConfig({ children }: { children?: React.ReactNode }) {
  const { addRule } = usePortForwardingConfig();
  
  return (
    <div>
      <Heading description="Forward ports of the Smart-EMS to devices in its networks.">
        <WrenchScrewdriverIcon className="w-5 h-5" />Port Forwarding</Heading>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        {/* Rules */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Rules</span>
            <Button
              onClick={() =>
                addRule({
                  name: "",
                  interface: "",
                  srcPort: 0,
                  destAddr: "",
                  destPort: 0,
                })
              }
            >
              <PlusIcon className="mr-2 w-5 h-5" />Add a rule
            </Button>
          </div>

          <PortForwardingRules />
        </div>
        {children}
      </div>
    </div>
  );
}
