import OPC_UA from "./OPC_UA"
import VNC from "./VNC"

interface props {
  name: string
  disabled?: boolean
}

export default function Action({name, disabled = false}: props) {
  if (name == "OPC-UA Server") {
    return <OPC_UA disabled={ disabled } />
  }

  if (name == "VNC Server") {
    return <VNC disabled={ disabled } />
  }

  return (
    <></>
  )
}
