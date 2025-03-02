import { IconCheck, IconX } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";

interface SlapResultProps {
  lastSlapResult: boolean | null;
}

export const SlapResult: React.FC<SlapResultProps> = ({ lastSlapResult }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lastSlapResult !== null) {
      setShow(true);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lastSlapResult]);

  if (lastSlapResult === null) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-400 ease-in-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div
        className={`alert ${
          lastSlapResult ? "alert-success" : "alert-error"
        } shadow-lg w-full max-w-md`}
      >
        <div>
          {lastSlapResult ? <IconCheck size={20} /> : <IconX size={20} />}
          <div>
            <h3 className="font-bold">
              {lastSlapResult ? "Valid slap!" : "Invalid slap!"}
            </h3>
            <div className="text-xs">
              {lastSlapResult
                ? "You successfully slapped the pile!"
                : "Oops! That was an invalid slap."}
            </div>
          </div>
        </div>
        <div className="flex-none">
          <div
            className={`badge ${
              lastSlapResult ? "badge-success" : "badge-error"
            } badge-sm`}
          >
            {lastSlapResult ? "Success" : "Failure"}
          </div>
        </div>
      </div>
    </div>
  );
};
