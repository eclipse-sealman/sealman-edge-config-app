import { Heading } from "@/components/Typography/Heading";
import { usePortForwardingConfig } from "./useContext";
import PortForwardingRules from "./PortForwardingRules";
import Button from "@/components/Input/Button";
import { PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";


export default function PortForwardingConfig() {
  const { addRule } = usePortForwardingConfig();
  
  return (
    <div className="rounded-md py-4 pr-4 space-y-4">
      <Heading>
        <WrenchScrewdriverIcon className="w-7 h-7 mr-1" />Port Forwarding Configuration</Heading>

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
    </div>
  );
}
