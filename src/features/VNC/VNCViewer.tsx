import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import RFB from '@novnc/novnc';
import { toast } from "react-toastify";

type VNCViewerProps = {
    url: string;
    password: string;
}

const VNCViewer: React.FC<VNCViewerProps> = ({ url, password }) => {
  const vncContainerRef = useRef(null);
  const rfbRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vncContainerRef.current) {
      // Initialize VNC connection
      rfbRef.current = new RFB(vncContainerRef.current, url, {
        credentials: { password },
      });

      // Setup VNC properties
      rfbRef.current.viewOnly = true;
      rfbRef.current.scaleViewport = true;

      // Add event listeners
      const handleSecurityFailure = () => {
        setError('Incorrect password. Please try again.');
        toast.error('Incorrect password. Please try again.')
        rfbRef.current.disconnect();
      };

      rfbRef.current.addEventListener('securityfailure', handleSecurityFailure);

      // Cleanup
      return () => {
        if (rfbRef.current) {
          rfbRef.current.removeEventListener('securityfailure', handleSecurityFailure);
          rfbRef.current.disconnect();
          rfbRef.current = null;
        }
      };
    }
  }, [url, password]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '20px',
            borderRadius: '8px',
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
      <div
        ref={vncContainerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      ></div>
    </div>
  );
};

export default VNCViewer;
