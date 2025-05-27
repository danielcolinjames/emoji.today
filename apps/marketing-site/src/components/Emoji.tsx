"use client"
import { getEmojiImageUrl, processImageForVibrantColorHex } from "@/lib/emojis";
import { useState, useEffect } from 'react';
import classNames from 'classnames';

export default function Emoji({ emoji, size = 250, hideBorder = false, hideBg = false }: { emoji: string | null, size: number, hideBorder?: boolean, hideBg?: boolean }) {
  const [emojiString, setEmojiString] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!emoji || emoji === '') {
      setEmojiString(null);
      return;
    }
    setEmojiString(getEmojiImageUrl(emoji ?? ''));
  }, [emoji]);

  const { color } = useEmojiColor(emojiString);

  const backgroundColor = color?.accent || '#000000';
  // const textColor = color?.whiteText ? '#FFFFFF' : '#000000';

  // if emoji is 150px, padding is 75px, border width is 15px
  const padding = size * 0.5
  const borderWidth = size * 0.1

  return (
    <div className={classNames("flex flex-col items-center justify-center rounded-full transition-border-color duration-[500ms]", { 'hover:cursor-grabbing': !hideBg })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: padding,
        border: hideBorder ? 'none' : `${borderWidth}px solid ${backgroundColor}`,
        backgroundColor: hideBg ? 'transparent' : isHovered ? `${backgroundColor}22` : 'black',
        width: size * 2, height: size * 2, minWidth: size * 2, minHeight: size * 2, maxWidth: size * 2, maxHeight: size * 2
      }}
    >
      {emojiString ? (
        <img
          src={emojiString}
          alt="emoji"
          style={{ width: size, height: size, minWidth: size, minHeight: size, maxWidth: size, maxHeight: size }}
        />
      ) : (
        <div
          className="bg-[#050505] rounded-full"
          style={{ padding: padding, border: `${borderWidth}px solid ${backgroundColor}`, width: size, height: size, minWidth: size, minHeight: size, maxWidth: size, maxHeight: size }}
        />
      )}
    </div>
  );
}

export function useEmojiColor(emojiUrl: string | null) {
  const [color, setColor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emojiUrl) {
      setColor(null);
      setIsLoading(false);
      setError(null);
      return
    }
    const fetchColor = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await processImageForVibrantColorHex(emojiUrl)
        setColor(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchColor();
  }, [emojiUrl]);

  return { color, isLoading, error };
}
