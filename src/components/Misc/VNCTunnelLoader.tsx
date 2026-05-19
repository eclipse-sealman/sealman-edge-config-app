import React from 'react';

type VNCTunnelLoaderProps = {
    text: string;
  };

export const VNCTunnelLoader: React.FC<VNCTunnelLoaderProps> = ({text}) => (
    <div className="flex items-center justify-center h-full">
      <div className="relative w-24 h-24">
        <svg className="absolute top-0 left-0 w-full h-full animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none">
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="#4f46e5"
            strokeWidth="4"
            className="opacity-20"
          />
          <path
            fill="#4f46e5"
            d="M25 5c11.046 0 20 8.954 20 20H40c0-8.284-6.716-15-15-15V5z"
            className="animate-pulse"
          />
        </svg>
        <p className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-center text-sm text-gray-700">
          {text}
        </p>
      </div>
    </div>
  );
