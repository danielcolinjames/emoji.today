"use client";

import { useEffect, useState, useMemo } from "react";
import { getRandomEmojis } from "~/lib/emojis";

interface EmojiProps {
  emoji?: string | null;
  containerSize?: number;
  borderWidth?: number;
  accentColor?: string;
  animate?: boolean;
}

const emojiColors: { [key: string]: string } = {
  "🙂": "#FFC107",
  "🌱": "#4CAF50",
  "💦": "#2196F3",
  "🔥": "#FF5722",
};

const Emoji: React.FC<EmojiProps> = ({
  emoji: initialEmoji = null,
  containerSize = 300,
  borderWidth = 18,
  accentColor,
  animate = false
}) => {
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(initialEmoji);
  const [isInitialAnimation, setIsInitialAnimation] = useState(animate && !initialEmoji);

  useEffect(() => {
    if (isInitialAnimation) {
      setCurrentEmoji("🙂");
      setIsInitialAnimation(false);
    } else if (initialEmoji) {
      setCurrentEmoji(initialEmoji);
    }
  }, [initialEmoji, animate, isInitialAnimation]);

  const emojiToRender = currentEmoji || (animate ? getRandomEmojis(1)[0] : null);

  useEffect(() => {
    if (animate && !isInitialAnimation) {
      const interval = setInterval(() => {
        setCurrentEmoji(getRandomEmojis(1)[0]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [animate, isInitialAnimation]);

  const EMOJI_TO_CONTAINER_RATIO = 166.6667 / 500;
  const emojiDisplaySize = useMemo(() => {
    return Math.floor(containerSize * EMOJI_TO_CONTAINER_RATIO);
  }, [containerSize]);

  const borderColor = accentColor || (emojiToRender && emojiColors[emojiToRender]) || '#FFFFFF';

  const componentStyle: React.CSSProperties = {
    width: `${containerSize}px`,
    height: `${containerSize}px`,
    borderWidth: `${borderWidth}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: borderColor,
    borderStyle: 'solid',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'border-color 0.5s ease-in-out, opacity 0.5s ease-in-out',
  };

  const emojiTextStyle: React.CSSProperties = {
    fontSize: `${emojiDisplaySize}px`,
    lineHeight: '1',
    textAlign: 'center',
  };

  return (
    <div style={componentStyle}>
      {emojiToRender ? (
        <span style={emojiTextStyle}>{emojiToRender}</span>
      ) : (
        <span style={emojiTextStyle}>⏳</span>
      )}
    </div>
  );
};

export default Emoji; 