"use client";

import { useEffect, useState, useCallback } from "react";
import sdk, { type Context, type FrameNotificationDetails, AddMiniApp } from "@farcaster/frame-sdk";
import { createStore } from "mipd";
import React from "react";
import Image from "next/image";

interface FrameContextType {
  isSDKLoaded: boolean;
  context: Context.FrameContext | undefined;
  openUrl: (url: string) => Promise<void>;
  close: () => Promise<void>;
  added: boolean;
  notificationDetails: FrameNotificationDetails | null;
  lastEvent: string;
  addFrame: () => Promise<void>;
  addFrameResult: string;
}

const FrameContext = React.createContext<FrameContextType | undefined>(undefined);

export function useFrame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<FrameNotificationDetails | null>(null);
  const [lastEvent, setLastEvent] = useState("");
  const [addFrameResult, setAddFrameResult] = useState("");

  // SDK actions only work in mini app clients, so this pattern supports browser actions as well
  const openUrl = useCallback(async (url: string) => {
    if (context) {
      await sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  }, [context]);

  const close = useCallback(async () => {
    if (context) {
      await sdk.actions.close();
    } else {
      window.close();
    }
  }, [context]);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);
      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails);
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notification token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : "Added, got no notification details"
      );
    } catch (error) {
      if (error instanceof AddMiniApp.RejectedByUser || error instanceof AddMiniApp.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      } else {
        setAddFrameResult(`Error: ${error}`);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setIsSDKLoaded(true);

      // Only set up event listeners if we have a context (running in Warpcast)
      if (context) {
        console.log("Farcaster context loaded:", context);

        // Set up event listeners
        sdk.on("frameAdded", ({ notificationDetails }) => {
          console.log("Frame added", notificationDetails);
          setAdded(true);
          setNotificationDetails(notificationDetails ?? null);
          setLastEvent("Frame added");
        });

        sdk.on("frameAddRejected", ({ reason }) => {
          console.log("Frame add rejected", reason);
          setAdded(false);
          setLastEvent(`Frame add rejected: ${reason}`);
        });

        sdk.on("frameRemoved", () => {
          console.log("Frame removed");
          setAdded(false);
          setLastEvent("Frame removed");
        });

        sdk.on("notificationsEnabled", ({ notificationDetails }) => {
          console.log("Notifications enabled", notificationDetails);
          setNotificationDetails(notificationDetails ?? null);
          setLastEvent("Notifications enabled");
        });

        sdk.on("notificationsDisabled", () => {
          console.log("Notifications disabled");
          setNotificationDetails(null);
          setLastEvent("Notifications disabled");
        });

        sdk.on("primaryButtonClicked", () => {
          console.log("Primary button clicked");
          setLastEvent("Primary button clicked");
        });
      }

      // Call ready action - THIS IS THE KEY PART FOR FARCASTER
      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up MIPD Store
      const store = createStore();
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
      });
    };

    if (sdk && !isSDKLoaded) {
      console.log("Loading Farcaster SDK");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  return {
    isSDKLoaded,
    context,
    added,
    notificationDetails,
    lastEvent,
    addFrame,
    addFrameResult,
    openUrl,
    close,
  };
}

export function FrameProvider({ children }: { children: React.ReactNode }) {
  const frameContext = useFrame();

  if (!frameContext.isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Image
          src="/images/logo-white.svg"
          alt="Loading"
          width={48}
          height={48}
          className="animate-spin"
        />
      </div>
    );
  }

  return (
    <FrameContext.Provider value={frameContext}>
      {children}
    </FrameContext.Provider>
  );
} 