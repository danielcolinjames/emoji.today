"use client"

import { useMemo } from "react";
import Image from "next/image";
import { getEmojiImageUrl as getEmojiImageUrlFromMapping } from "@emoji.today/emoji-assets/src/filename-mapping";

interface EmojiProps {
  emoji: string;
  filename?: string;
  containerSize?: number;
  borderWidth?: number;
  accentColor?: string;
}

const Emoji: React.FC<EmojiProps> = ({
  emoji,
  filename,
  containerSize = 300,
  borderWidth = 18,
  accentColor = '#FFFFFF'
}) => {
  const imageSize = useMemo(() => {
    // Use the specific aspect ratio requested: 166.667
    // This maintains consistency with the original design
    const ratio = 166.667 / 500; // Original ratio for 500px container
    return Math.floor(containerSize * ratio);
  }, [containerSize]);

  // Get the correct emoji image URL using the proper mapping
  const emojiImageUrl = useMemo(() => {
    return getEmojiImageUrlFromMapping(emoji);
  }, [emoji]);

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

  return (
    <div style={componentStyle}>
      {emojiImageUrl ? (
        <Image
          src={emojiImageUrl}
          alt={emoji}
          width={imageSize}
          height={imageSize}
          style={{
            objectFit: 'contain',
          }}
          onError={(e) => {
            // Fallback to text emoji if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallbackSpan = document.createElement('span');
              fallbackSpan.textContent = emoji;
              fallbackSpan.style.fontSize = `${Math.floor(containerSize * 0.4)}px`;
              fallbackSpan.style.lineHeight = '1';
              parent.appendChild(fallbackSpan);
            }
          }}
        />
      ) : (
        // Fallback to text if no image URL found
        <span style={{
          fontSize: `${Math.floor(containerSize * 0.4)}px`,
          lineHeight: '1',
          textAlign: 'center',
        }}>
          {emoji}
        </span>
      )}
    </div>
  );
};

export default Emoji;
