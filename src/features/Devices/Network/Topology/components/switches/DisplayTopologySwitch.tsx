import { Switch } from "@/components/ui/switch";

interface DisplayTopologySwitchProps {
  displayTopology: boolean;
  setDisplayTopology: (checked: boolean) => void;
}

export default function DisplayTopologySwitch({
  displayTopology,
  setDisplayTopology,
}: DisplayTopologySwitchProps) {
  const handleChange = (checked: boolean) => {
    setDisplayTopology(checked);
  };
  return <Switch
    checked={displayTopology}
    onCheckedChange={handleChange}
    id="display-topology-switch"
    aria-label="Display Topology Switch"
  />;
}