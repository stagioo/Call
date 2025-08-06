"use client";

import { useEffect, useCallback } from "react";
import { useCallContext } from "@/contexts/call-context";
import { toast } from "sonner";
export const useCallAccess = () => {
  const {
    state,
    dispatch,
    session: { user },
  } = useCallContext();

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (!state.callId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${state.callId}/creator`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: "SET_CREATOR_INFO", payload: data.creator });
        }
      } catch (error) {
        console.error("Error fetching creator info:", error);
      }
    };

    fetchCreatorInfo();
  }, [state.callId, dispatch]);

  useEffect(() => {
    if (state.joined || !user.id || !state.callId) return;

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${state.callId}/check-access`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: "SET_HAS_ACCESS", payload: data.hasAccess });
          dispatch({ type: "SET_CREATOR", payload: data.isCreator });
        }
      } catch (error) {
        console.error("Error checking call access:", error);
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 3000);
    return () => clearInterval(interval);
  }, [state.callId, user.id, state.joined, dispatch]);

  const handleRequestAccess = useCallback(async () => {
    if (!state.callId || !user.id) {
    
      return;
    }

    dispatch({ type: "SET_REQUESTING_ACCESS", payload: true });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${state.callId}/request-join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
   
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      
    } finally {
      dispatch({ type: "SET_REQUESTING_ACCESS", payload: false });
    }
  }, [state.callId, user.id, dispatch]);

  return {
    isCreator: state.isCreator,
    hasAccess: state.hasAccess,
    isRequestingAccess: state.isRequestingAccess,
    creatorInfo: state.creatorInfo,
    handleRequestAccess,
  };
};
