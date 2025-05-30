"use client";

import { useState, useEffect } from 'react';
import { searchEmojis, DatabaseEmoji } from '@/lib/emojis';

export function DebugImageButton() {
  const [showModal, setShowModal] = useState(false);
  const [imageType, setImageType] = useState<'og' | 'participation'>('og');
  const [selectedEmoji, setSelectedEmoji] = useState('💯');
  const [emojiData, setEmojiData] = useState<DatabaseEmoji | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_HIDE_DEBUG_BUTTON === 'true') {
    return null;
  }

  // Fetch emoji data when selectedEmoji changes
  useEffect(() => {
    const fetchEmojiData = async () => {
      try {
        const results = await searchEmojis(selectedEmoji);
        if (results.length > 0) {
          setEmojiData(results[0]);
        }
      } catch (error) {
        console.error('Failed to fetch emoji data:', error);
        setEmojiData(null);
      }
    };
    fetchEmojiData();
  }, [selectedEmoji]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Curated emoji list - including edge cases and various types
  const emojiOptions = [
    // Original set
    '💯', '🔥', '🌱', '💦', '👀', '👍', '👎', '👏', '💪', '💎',
    '❇️', '🥶', '🖲️', '👨‍💻', '❤️', '💙', '💚', '💛', '💜', '🖤', '🤍', '🧡',
    // Simple symbols with variation selectors
    '⭐', '✨', '☀️', '❄️', '✅', '❌', '✔️', '✖️', '♥️', '♠️', '♦️', '♣️',
    // Complex emoji sequences
    '👨‍👩‍👧‍👦', // Family
    '🏳️‍🌈', // Rainbow flag
    '🏴‍☠️', // Pirate flag
    '👨‍🦱', // Man with curly hair
    '👩‍🦰', // Woman with red hair
    '🧑‍🦲', // Person bald
    '❤️‍🔥', // Heart on fire
    '❤️‍🩹', // Mending heart
    // Keycap sequences
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '*️⃣', '#️⃣',
    // Skin tone modifiers (testing we exclude them)
    '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿',
    // Regional indicators (should be excluded as standalone)
    '🇦', '🇧', '🇨',
    // Country flags
    '🇺🇸', '🇬🇧', '🇯🇵', '🇨🇦', '🇦🇺', '🇰🇷',
    // Newer emojis
    '🫠', '🫡', '🫥', '🫨', '🫧', '🫶', '🪩', '🪻',
    // Special symbols
    '™️', '©️', '®️', '‼️', '⁉️', '⚠️', '☢️', '☣️',
    // Geometric shapes
    '🔴', '🟢', '🔵', '🟡', '🟣', '⚫', '⚪',
    '🟥', '🟩', '🟦', '🟨', '🟪', '⬛', '⬜',
    '🔶', '🔷', '🔸', '🔹', '💠',
    '▪️', '▫️', '◼️', '◻️', '◾', '◽',
    // Clock faces
    '🕐', '🕑', '🕒', '🕓', '🕔', '🕕',
    // Animals with issues sometimes
    '🐕‍🦺', // Service dog
    '🦮', // Guide dog
    '🐈‍⬛', // Black cat
    // Food
    '🍕', '🍔', '🌮', '🌯', '🥗', '🥙',
    // Objects that might not have colors
    '🗳️', // Ballot box (used as default)
    '📱', '💻', '⌨️', '🖥️', '🖨️',
    // Text symbols
    '🆘', '🅰️', '🅱️', '🅾️', '🆎',
    // Weather
    '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️',
    // Zodiac
    '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
    // Chess pieces
    '♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟️',
    // Musical notes
    '♩', '♪', '♫', '♬', '🎵', '🎶', '🎼', '🎹',
    // Arrows
    '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↘️', '↙️', '↖️',
    '⤴️', '⤵️', '🔃', '🔄', '↩️', '↪️',
  ];

  // Sample parameters for testing
  const today = new Date().toISOString().split('T')[0];
  const sampleUsername = 'testuser';
  const sampleUserId = '123456';

  const ogUrl = `/api/og?emoji=${encodeURIComponent(selectedEmoji)}&date=${today}&accentColor=${encodeURIComponent(emojiData?.accent_color || '#FFFFFF')}`;
  const participationUrl = `/api/participation?emoji=${encodeURIComponent(selectedEmoji)}&date=${today}&username=${sampleUsername}&userId=${sampleUserId}&accentColor=${encodeURIComponent(emojiData?.accent_color || '#FFFFFF')}`;

  const currentUrl = imageType === 'og' ? ogUrl : participationUrl;
  const currentDimensions = imageType === 'og' ? { width: 1200, height: 630 } : { width: 1000, height: 1000 };

  return (
    <>
      {/* Debug Button */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-lg text-white border border-white/20 font-mono text-xs px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200 z-50"
        title="Debug Image Generation"
      >
        🖼️ Debug
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold font-mono">Image Debug Panel</h2>
              <button
                onClick={handleCloseModal}
                className="text-white/60 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Controls */}
            <div className="mb-6 space-y-4">
              {/* Image Type Selector */}
              <div className="flex items-center gap-4">
                <label className="text-white/80 font-mono text-sm">Type:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageType('og')}
                    className={`px-3 py-1 rounded text-sm font-mono transition-colors ${imageType === 'og'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                  >
                    OG (1200×630)
                  </button>
                  <button
                    onClick={() => setImageType('participation')}
                    className={`px-3 py-1 rounded text-sm font-mono transition-colors ${imageType === 'participation'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                  >
                    NFT (1000×1000)
                  </button>
                </div>
              </div>

              {/* Emoji Selector */}
              <div className="flex items-center gap-4">
                <label className="text-white/80 font-mono text-sm">Emoji:</label>
                <div className="flex gap-2 flex-wrap max-w-4xl max-h-64 overflow-y-auto">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 rounded text-xl transition-colors relative ${selectedEmoji === emoji
                        ? 'bg-white text-black'
                        : 'bg-white/10 hover:bg-white/20'
                        }`}
                      title={emoji}
                    >
                      {emoji}
                      {/* Show a small indicator if emoji has no accent color */}
                      {selectedEmoji === emoji && !emojiData && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" title="No accent color in database" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Data Display */}
              <div className="flex items-center gap-4">
                <label className="text-white/80 font-mono text-sm">Data:</label>
                {emojiData ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-white/30"
                        style={{ backgroundColor: emojiData.accent_color }}
                      />
                      <code className="text-xs text-white/60">{emojiData.accent_color}</code>
                    </div>
                    <span className="text-white/60 text-sm">{emojiData.name}</span>
                  </div>
                ) : (
                  <span className="text-red-400 text-sm">
                    {selectedEmoji ? 'Not in database - using default white' : 'Select an emoji'}
                  </span>
                )}
              </div>

              {/* URL Display */}
              <div className="flex items-center gap-4">
                <label className="text-white/80 font-mono text-sm">URL:</label>
                <code className="text-white/60 text-xs bg-white/5 px-2 py-1 rounded flex-1 break-all">
                  {currentUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${currentUrl}`)}
                  className="text-white/60 hover:text-white text-sm font-mono px-2 py-1 bg-white/10 rounded"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-center">
                <div
                  className="border border-white/20 rounded-lg overflow-hidden bg-white/5"
                  style={{
                    width: Math.min(currentDimensions.width * 0.5, 600),
                    height: Math.min(currentDimensions.height * 0.5, 500),
                  }}
                >
                  <iframe
                    src={currentUrl}
                    style={{
                      width: currentDimensions.width,
                      height: currentDimensions.height,
                      transform: `scale(${Math.min(600 / currentDimensions.width, 500 / currentDimensions.height)})`,
                      transformOrigin: 'top left',
                      border: 'none',
                    }}
                    title={`${imageType} preview`}
                  />
                </div>
              </div>

              {/* Dimensions Info */}
              <div className="text-center mt-4">
                <span className="text-white/60 text-sm font-mono">
                  {currentDimensions.width} × {currentDimensions.height}px
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => window.open(currentUrl, '_blank')}
                className="bg-white/10 text-white px-4 py-2 rounded font-mono text-sm hover:bg-white/20 transition-colors"
              >
                Open in New Tab
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = currentUrl;
                  link.download = `${imageType}-${selectedEmoji}-${today}.png`;
                  link.click();
                }}
                className="bg-white/10 text-white px-4 py-2 rounded font-mono text-sm hover:bg-white/20 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 