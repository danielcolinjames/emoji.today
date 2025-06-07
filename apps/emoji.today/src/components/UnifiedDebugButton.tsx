"use client"

import { useState, useEffect } from 'react'
import { DevPanel } from './DevPanel'
import { searchEmojis, DatabaseEmoji } from '@/lib/emojis'
import { invalidateVotingCaches } from "@/lib/swr-utils"
import { getCurrentVotingDateString } from "@/lib/date-utils"

export function UnifiedDebugButton() {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT
  const isDev = process.env.NODE_ENV === 'development'
  const [isInterstitialOpen, setIsInterstitialOpen] = useState(false)
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false)
  const [isImageDebugOpen, setIsImageDebugOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Don't show in production
  if (!env || env === 'production') return null
  if (process.env.NODE_ENV === 'production' && env !== 'staging') return null

  const getEnvColor = () => {
    switch (env) {
      case 'staging':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
      case 'development':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-200'
      default:
        return 'bg-red-500/20 border-red-500/50 text-red-200'
    }
  }

  const handleBadgeClick = () => {
    setIsInterstitialOpen(true)
  }

  const handleDevPanelOpen = () => {
    setIsInterstitialOpen(false)
    setIsDevPanelOpen(true)
  }

  const handleImageDebugOpen = () => {
    setIsInterstitialOpen(false)
    setIsImageDebugOpen(true)
  }

  const handleDevAction = async (action: () => Promise<any>) => {
    setIsLoading(true)
    try {
      const result = await action()

      // Invalidate SWR caches after successful dev action
      if (result.success) {
        const today = getCurrentVotingDateString()
        invalidateVotingCaches(today)
        console.log("🔄 Dev action completed, invalidated caches")
      }

      setMessage(result.message)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Unified Debug Badge - Bottom Right */}
      <button
        onClick={handleBadgeClick}
        className={`fixed bottom-15 right-5 ${getEnvColor()} backdrop-blur-lg border rounded-full px-2 py-1 font-geist-mono text-xs font-bold tracking-wider hover:opacity-80 transition-opacity duration-200 z-50 cursor-pointer`}
        title="Debug Panel"
      >
        {env.toUpperCase()}
      </button>

      {/* Interstitial Panel */}
      {isInterstitialOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light text-white">Debug Panel</h2>
              <button
                onClick={() => setIsInterstitialOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Dev Tools Option */}
              {env === 'staging' && (
                <button
                  onClick={handleDevPanelOpen}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Development Tools</h3>
                      <p className="text-neutral-400 text-sm">Voting controls, test data generation</p>
                    </div>
                    <svg className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Image Debug Option */}
              {isDev && (
                <button
                  onClick={handleImageDebugOpen}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">OG Image Debug</h3>
                      <p className="text-neutral-400 text-sm">Preview and test generated images</p>
                    </div>
                    <svg className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Environment Info */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${env === 'staging' ? 'bg-yellow-500' : env === 'development' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  <div>
                    <h3 className="text-white font-medium">{env.toUpperCase()} Environment</h3>
                    <p className="text-neutral-400 text-sm">Node: {process.env.NODE_ENV}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render the actual panels */}
      <DevPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
        onDevAction={handleDevAction}
        isLoading={isLoading}
        message={message}
      />

      {/* For image debug, we need to conditionally render the content */}
      {isImageDebugOpen && (
        <ImageDebugModal isOpen={isImageDebugOpen} onClose={() => setIsImageDebugOpen(false)} />
      )}
    </>
  )
}

// Extract the image debug modal content to avoid duplicating the DebugImageButton logic
function ImageDebugModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [imageType, setImageType] = useState<'og' | 'participation'>('og');
  const [selectedEmoji, setSelectedEmoji] = useState('💯');
  const [emojiData, setEmojiData] = useState<DatabaseEmoji | null>(null);

  if (!isOpen) return null

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold font-mono">Image Debug Panel</h2>
          <button
            onClick={onClose}
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
  )
} 