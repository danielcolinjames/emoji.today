"use client"

import { getRandomEmojis, getEmojiImageUrl } from "@/lib/emojis";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useEmojiColor } from "../../../../lib/hooks/useEmojiColor";

interface EmojiProps {
  emoji?: string | null;
  containerSize?: number;
  borderWidth?: number;
  animate?: boolean;
}

const Emoji: React.FC<EmojiProps> = ({
  emoji: initialEmoji = null,
  containerSize = 300,
  borderWidth = 18,
  animate = false
}) => {
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(initialEmoji);
  const [isInitialAnimation, setIsInitialAnimation] = useState(animate && !initialEmoji);
  const [hasLoadedFirstColor, setHasLoadedFirstColor] = useState(false);

  useEffect(() => {
    if (isInitialAnimation) {
      setCurrentEmoji("🙂");
      setIsInitialAnimation(false);
    } else if (initialEmoji) {
      setCurrentEmoji(initialEmoji);
    }
  }, [initialEmoji, animate, isInitialAnimation]);

  const emojiToRender = currentEmoji || (animate ? getRandomEmojis(1)[0] : null);
  const emojiImageUrl = useMemo(() => emojiToRender ? getEmojiImageUrl(emojiToRender) : null, [emojiToRender]);

  const { color: accentColor, isLoading: isColorLoading, error: colorError } = useEmojiColor(emojiImageUrl);

  useEffect(() => {
    if (!isColorLoading && accentColor && !hasLoadedFirstColor) {
      setHasLoadedFirstColor(true);
    }
  }, [isColorLoading, accentColor, hasLoadedFirstColor]);

  useEffect(() => {
    if (animate && !isInitialAnimation) {
      const interval = setInterval(() => {
        setCurrentEmoji(getRandomEmojis(1)[0]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [animate, isInitialAnimation]);

  const EMOJI_TO_CONTAINER_RATIO = 166 / 500;
  const emojiDisplaySize = useMemo(() => {
    return Math.floor(containerSize * EMOJI_TO_CONTAINER_RATIO);
  }, [containerSize]);

  // Debug logging
  useEffect(() => {
    if (emojiImageUrl) {
      console.log('Emoji URL:', emojiImageUrl);
      console.log('Container size:', containerSize);
      console.log('Display size:', emojiDisplaySize);
    }
  }, [emojiImageUrl, containerSize, emojiDisplaySize]);

  const componentStyle: React.CSSProperties = {
    width: `${containerSize}px`,
    height: `${containerSize}px`,
    borderWidth: `${borderWidth}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: accentColor || '#FFFFFF',
    borderStyle: 'solid',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'border-color 0.5s ease-in-out, opacity 0.5s ease-in-out',
    opacity: (isColorLoading && !hasLoadedFirstColor) ? 0 : 1,
  };

  const emojiTextStyle: React.CSSProperties = {
    fontSize: `${emojiDisplaySize}px`,
    lineHeight: '1',
    textAlign: 'center',
  };

  if (colorError) {
    console.error("Error loading emoji color:", colorError);
  }

  return (
    <div style={componentStyle}>
      {emojiImageUrl ? (
        <Image
          src={emojiImageUrl}
          alt={currentEmoji || "emoji"}
          width={emojiDisplaySize}
          height={emojiDisplaySize}
          style={{ objectFit: "contain" }}
          priority
        />
      ) : currentEmoji ? (
        <span style={emojiTextStyle}>{currentEmoji}</span>
      ) : (
        <span style={emojiTextStyle}>⏳</span>
      )}
    </div>
  );
};

export default Emoji;
