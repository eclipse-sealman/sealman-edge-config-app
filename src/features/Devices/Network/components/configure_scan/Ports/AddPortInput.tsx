import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "react-toastify";
import { useScanDefinitionStore } from "../../../stores";

export default function AddPortInput() {
  const ports = useScanDefinitionStore(s => s.ports)
  const addPort = useScanDefinitionStore(s => s.addPort)
  const [inputValue, setInputValue] = useState("")

  const addPortsFromValue = () => {
    const newPorts = Array.from(
      new Set(
        inputValue
          .split(",")
          .map(port => parseInt(port))
          .filter(port => !isNaN(port))
      )
    )

    const duplicatePorts = newPorts.filter(port => ports.includes(port));
    if (duplicatePorts.length > 0) {
      toast.error(`Port(s) ${duplicatePorts.join(", ")} already exist`);
    }

    const uniquePorts = newPorts.filter(port => !ports.includes(port));
    if (uniquePorts.length > 0) {
      uniquePorts.forEach(port => addPort(port))
    }

    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers, commas, and control keys
    if (
      !/[0-9,]/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      !(e.ctrlKey || e.metaKey)
    ) {
      e.preventDefault();
    }

    if (e.key === "Enter") {
      addPortsFromValue()
    }
  };

  return (
    <div className="flex items-start gap-2">
      <Input
        id="add-port-input"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add port(s) (e.g., 80 or 80,443,...)"
      />
      <Button
        type="button"
        variant="outline"
        onClick={addPortsFromValue}
        disabled={inputValue.trim().length === 0}
        className={
          inputValue.trim().length > 0
            ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
            : undefined
        }
      >
        Add
      </Button>
    </div>
  )
}
