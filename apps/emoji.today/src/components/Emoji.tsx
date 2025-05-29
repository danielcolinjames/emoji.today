"use client"

import { useMemo } from "react";

interface EmojiProps {
  emoji: string;
  containerSize?: number;
  borderWidth?: number;
  accentColor?: string;
}

const Emoji: React.FC<EmojiProps> = ({
  emoji,
  containerSize = 300,
  borderWidth = 18,
  accentColor = '#FFFFFF'
}) => {
  const EMOJI_TO_CONTAINER_RATIO = 166.6667 / 500;
  const emojiDisplaySize = useMemo(() => {
    return Math.floor(containerSize * EMOJI_TO_CONTAINER_RATIO);
  }, [containerSize]);

  const componentStyle: React.CSSProperties = {
    width: `${containerSize}px`,
    height: `${containerSize}px`,
    borderWidth: `${borderWidth}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: accentColor,
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
      <span style={emojiTextStyle}>{emoji}</span>
    </div>
  );
};

export default Emoji;
