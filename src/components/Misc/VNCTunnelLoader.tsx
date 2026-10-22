import React from 'react';
import { WaterLoader } from '@/components/ui/water-loader';

type VNCTunnelLoaderProps = {
  text: string;
};

export const VNCTunnelLoader: React.FC<VNCTunnelLoaderProps> = ({ text }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4">
    <WaterLoader className="h-24 w-24" />
    <p className="text-center text-sm text-gray-700">{text}</p>
  </div>
);
