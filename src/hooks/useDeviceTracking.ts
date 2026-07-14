import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { captureUserTracking } from "@/lib/deviceTracking";

export function useDeviceTracking() {
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      // Capture device and location info when wallet connects
      captureUserTracking(publicKey.toString()).catch((err) =>
        console.warn("Device tracking failed:", err)
      );
    }
  }, [publicKey]);
}

export default useDeviceTracking;
