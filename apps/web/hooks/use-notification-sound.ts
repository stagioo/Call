import { useCallback, useRef } from "react";

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification-sound.mp3");
        audioRef.current.volume = 0.5;
      }

      audioRef.current.play().catch((error) => {
        console.error("Failed to play notification sound:", error);
      });
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, []);

  return { playNotificationSound };
};
