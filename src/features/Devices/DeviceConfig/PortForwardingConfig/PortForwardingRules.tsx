import { usePortForwardingConfig } from "./useContext";
import PortForwardingRule from "./PortForwardingRule";

export default function PortForwardingRules() {
  const { config } = usePortForwardingConfig();

  if (!config?.rules?.length) {
    return <div className="text-sm text-gray-500">No rules added</div>;
  }

  return (
    <div className="space-y-2">
      {config.rules.map((rule, index) => (
        <PortForwardingRule
          key={index}
          index={index}
          rule={rule}
        />
      ))}
    </div>
  );
}
