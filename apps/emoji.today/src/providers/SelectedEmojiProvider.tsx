'use client';

import { getEmojiColor, getEmojiImageUrl } from "@/lib/emojis";
import { createContext, useContext, useEffect, useState } from "react";

interface SelectedEmojiContextType {
  selectedEmoji: string | null;
  setSelectedEmoji: (emoji: string | null) => void;
  selectedEmojiImageUrl: string | null;
  setSelectedEmojiImageUrl: (url: string | null) => void;
  // selectedEmojiCodePoints: string | null;
  // setSelectedEmojiCodePoints: (codePoints: string | null) => void;
  selectedEmojiColor: string | null;
  setSelectedEmojiColor: (color: string | null) => void;
}

const SelectedEmojiContext = createContext<SelectedEmojiContextType | null>(null);

export const SelectedEmojiProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedEmojiImageUrl, setSelectedEmojiImageUrl] = useState<string | null>(null);
  // const [selectedEmojiCodePoints, setSelectedEmojiCodePoints] = useState<string | null>(null);
  const [selectedEmojiColor, setSelectedEmojiColor] = useState<any>(null);

  const contextValue = {
    selectedEmoji,
    setSelectedEmoji,
    selectedEmojiImageUrl,
    setSelectedEmojiImageUrl,
    // selectedEmojiCodePoints,
    // setSelectedEmojiCodePoints,
    selectedEmojiColor,
    setSelectedEmojiColor,
  };

  return (
    <SelectedEmojiContext.Provider value={contextValue}>
      {children}
    </SelectedEmojiContext.Provider>
  );
};

export const useSelectedEmoji = () => {
  const context = useContext(SelectedEmojiContext);
  if (!context) {
    throw new Error('useSelectedEmoji must be used within a SelectedEmojiProvider');
  }
  return context;
};
