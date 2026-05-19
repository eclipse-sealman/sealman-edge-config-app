import React, { useState, useEffect } from 'react';
import VNCViewer from '../features/VNC/VNCViewer';
import { webVNCApi } from '../api/webVNCApi/webVNCApi';
import { toast } from "react-toastify";
import Button from '@/components/Input/Button';
import { Input } from '@/components/Input/FormElements';
import { ButtonColor } from '@/components/Input/Button';
import { useRef } from 'react';
import { AxiosError } from 'axios';
import { VNCTunnelLoader } from '@/components/Misc/VNCTunnelLoader'; 


type ControlBarProps = {
  onDelete: () => void;
  onRecreate: () => void;
  isProcessing: boolean
};

const ControlBar: React.FC<ControlBarProps> = ({ onDelete, onRecreate, isProcessing }) => (
  <div className="flex justify-between items-center bg-gray-200 p-2 border-b border-gray-300">
    <Button onClick={onRecreate} processing={isProcessing}>Recreate Tunnel</Button>
    <Button onClick={onDelete} processing={isProcessing} color={ButtonColor.Red}>Delete Tunnel</Button>
  </div>
);

type WebVNCAppProps = {
  deviceId: string;
  sourceIp: string;
};

const WebVNCApp: React.FC<WebVNCAppProps> = ({ deviceId, sourceIp }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [websocketURL, setWebsocketURL] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState<string>('');
  const timeoutRef = useRef<number | null>(null);

  const resetTimeout = (autoCloseTimeout: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCloseReason(`Timeout - closing backend tunnel to ${sourceIp}. Please try again.`);
      setIsDisabled(true);
    }, autoCloseTimeout * 1000);
  };

  const createVNCInstance = async () => {
    try {
      setIsDisabled(false);
      setLoading(true);
      setPassword('');
      setConnected(false);

      const instanceRequest = {
        deviceId: deviceId,
        sourceIp: sourceIp,
        sourcePort: 5900, // this may individual and need to be optained from the network scan
        autoCloseTimeout: 30 // Timeout in seconds
      };

      const response = await webVNCApi.putWebvncNewInstance(instanceRequest);
      setWebsocketURL(response.apiWebsocket);
      setInstanceId(response.id);
      resetTimeout(instanceRequest.autoCloseTimeout);

    } catch (error) {
      toast.error(`Error during tunnel creation to ${sourceIp}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const deleteVNCInstance = async () => {
    if (!instanceId) {
      toast.error('No instance ID available to delete.');
      return;
    }

    try {
      await webVNCApi.deleteWebvncInstance(instanceId);
      toast.success('Tunnel deleted successfully.');
      setCloseReason(`Tunnel to ${sourceIp} closed by user`);
      setWebsocketURL(null);
      setConnected(false);
      setPassword('');
      setInstanceId(null);
      setIsDisabled(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

    } catch (error: AxiosError | any) {
      if (error.response?.status === 404){
        toast.warning(`Tunnel to ${sourceIp} already closed by backend`);
      } else {
        toast.error('Failed to delete tunnel. Please try again.');
      }
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    if (!password || !websocketURL) {
      toast.info('Please enter a VNC password.');
      setIsConnecting(false);
      return;
    }
    setIsConnecting(false);
    setConnected(true);
  };

  useEffect(() => {
    createVNCInstance();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full">
      <ControlBar onDelete={deleteVNCInstance} onRecreate={createVNCInstance} isProcessing={loading}/>
      {loading ? (
         <div className="flex items-center justify-center h-full relative">
         <div className="absolute top-1/4 transform -translate-y-1/4">
           <VNCTunnelLoader text={"Establishing secure tunnel..."} />
         </div>
       </div>
      ) : !connected ? (
        <div className="text-center p-5 space-y-4">
          <h3>Enter VNC Password</h3>
          <div className="flex flex-col items-center gap-4">
            <Input
              type="password"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="VNC Password"
              disabled={isDisabled}
            />
            <Button
              processing={isConnecting}
              onClick={handleConnect}
              disabled={isDisabled}
            >
              Connect
            </Button>
          </div>
          {isDisabled && (
            <p className="text-red-500">
              {closeReason}
            </p>
          )}
        </div>
      ) : websocketURL ? (
        <VNCViewer url={websocketURL} password={password} />
      ) : null}
    </div>
  );
};

export default WebVNCApp;
