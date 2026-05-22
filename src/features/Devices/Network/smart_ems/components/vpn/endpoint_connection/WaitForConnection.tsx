import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, Callout } from "../../Alert";

interface props {
  lastSeen: Date;
  totalWaitTime?: number;
  reversed?: boolean;
}

export default function WaitForConnection({
  lastSeen,
  totalWaitTime = 5 * 60 * 1000, // Default 5 minutes in milliseconds
}: props) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const isDone = progress >= 100
  const isError = elapsedTime > 10 * 60 * 1000;

  useEffect(() => {
    if (isDone) {
      return
    }

    const updateProgress = () => {
      const now = new Date();
      const elapsedTime = now.getTime() - lastSeen.getTime();
      setElapsedTime(elapsedTime);

      const  calculatedProgress = Math.min(100, (elapsedTime / totalWaitTime) * 100);

      setProgress(calculatedProgress);
    };

    updateProgress();

    const intervalId = setInterval(updateProgress, 1000);

    return () => clearInterval(intervalId);
  }, [lastSeen, totalWaitTime, isDone]);

  if (isError) {
      return (
        <>
          <Alert title="Connection Timeout">
            <p>
              The endpoint has been offline for more than 10 minutes. There may be a connectivity issue.
            </p>
            <p>
              Please contact your division administrator.
              {/* TODO Sync 2/06: create a component for copying support information so service technician can paste it easily */}
            </p>
            <p className="text-muted-foreground text-right">
              Last connection at: {lastSeen.toLocaleString()}
            </p>
          </Alert>
        </>
      );
    }

  if (isDone) {
    return <>
      <Callout title="Endpoint should be ready">
        <p>
          Please refresh the page, the VPN container should have updated its latest configuration with the newly added endpoint devices.
        </p>
        <p className="text-muted-foreground text-right">Last connection at: {lastSeen.toLocaleString()}</p>
      </Callout>
    </>
  }

  return (
    <>
      <Alert title="Route Setup in Progress">
        <p>You’ll be able to connect to this endpoint once the container reconnects to the Smart EMS.</p>
        <div>
          <p className="text-muted-foreground">
            Next connection attempt in: {Math.round(totalWaitTime / 1000) - Math.round(elapsedTime / 1000)}{" "}
            seconds
          </p>
          <Progress value={progress} className="w-full [&>div]:bg-gray-100 bg-muted-foreground" />
          <p className="text-muted-foreground text-right">Last connection at: {lastSeen.toLocaleString()}</p>
        </div>
      </Alert>
    </>
  );
}
