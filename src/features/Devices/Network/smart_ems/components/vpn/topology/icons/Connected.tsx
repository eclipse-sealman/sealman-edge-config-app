import { ChevronsLeftRightEllipsis } from "lucide-react";

interface props {
  isConnected?: boolean;
}

export const Connected = ({ isConnected }: props) => {
  return <ChevronsLeftRightEllipsis className={isConnected ? "text-green-500" : "text-red-500"} />;
};
