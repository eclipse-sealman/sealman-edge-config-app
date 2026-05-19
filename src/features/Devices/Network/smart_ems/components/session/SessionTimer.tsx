import { useState, useEffect, useRef } from "react";
import { useGetSessionValidityPeriod } from "../../hooks/useGetSessionValidityPeriod";

export function SessionTimer() {
  const { secondsLeft, sessionTimeout } = useGetSessionValidityPeriod();

  if (!secondsLeft) {
    return;
  }

  if (!sessionTimeout) {
    return;
  }

  return <AuthorizedTimer durationLeft={secondsLeft} maxDuration={sessionTimeout} />;
}

const AuthorizedTimer = ({ durationLeft, maxDuration }: { durationLeft: number; maxDuration: number }) => {
  const [timeRemaining, setTimeRemaining] = useState(durationLeft);
  const [isActive, setIsActive] = useState(true);
  const progressPercentage = maxDuration != 0 ? (timeRemaining / maxDuration) * 100 : 0;
  const lastSyncedDuration = useRef(durationLeft);

  // Sync with external duration changes
  useEffect(() => {
    if (Math.abs(durationLeft - lastSyncedDuration.current) > 2) {
      setTimeRemaining(durationLeft);
      lastSyncedDuration.current = durationLeft;
    }
  }, [durationLeft]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((time) => {
        if (time <= 1) {
          setIsActive(false);
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  const getDisplayText = () => {
    if (timeRemaining >= 60) {
      return `${Math.ceil(timeRemaining / 60).toString()} min`;
    } else {
      return `${timeRemaining.toString()} sec`;
    }
  };

  const getColor = () => {
    const minutes = timeRemaining / 60;
    if (minutes > 5) return "#d1fae5";
    if (minutes > 2) return "#ffedd5";
    return "#fee2e2";
  };

  return (
    <div className="relative w-full bg-white rounded-2xl border overflow-hidden h-5 border-input">
      <div
        className="absolute top-0 left-0 h-full w-full"
        style={{
          backgroundColor: getColor(),
        }}
      />

      <div
        className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-linear"
        style={{
          width: `${100 - progressPercentage}%`,
        }}
      />

      <div
        className={`
        absolute inset-0 flex items-center justify-center
        text-xs text-muted-foreground}
        transition-colors duration-500 ease-in-out
        z-10
        `}
      >
        {getDisplayText()}
      </div>
    </div>
  );
};
