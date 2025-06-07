"use client"

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { X, Trash2, Zap, Shuffle, Target } from 'lucide-react'
import { clearUserVote } from '@/lib/actions'
import { mutate } from 'swr'
import {
  addQuickVoteAction,
  generateRandomVotesAction,
  seedVotesForEmojiAction,
  clearAllVotesAction,
  changeMyVoteAction
} from '@/actions/dev-tools'

interface DevPanelProps {
  isOpen: boolean
  onClose: () => void
  onDevAction?: (action: () => Promise<any>) => Promise<void>
  isLoading?: boolean
  message?: string
}

// Curated rainbow of popular emojis for quick voting
const QUICK_VOTE_EMOJIS = [
  '🔥', '⚡', '🎯', '💯', '🚀', '✨', '💫', '🌟',
  '🎉', '💪', '👍', '❤️', '😍', '😎', '🤔', '😊',
  '🙌', '🔮', '💎', '🏆', '⭐', '💖', '🌈', '🎊'
]

export function DevPanel({ isOpen, onClose, onDevAction, isLoading, message: externalMessage }: DevPanelProps) {
  const { data: session } = useSession()
  const [internalMessage, setInternalMessage] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [count, setCount] = useState(5)
  const [seedEmoji, setSeedEmoji] = useState('🔥')
  const [seedCount, setSeedCount] = useState(10)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  // Use external message if provided, otherwise use internal
  const displayMessage = externalMessage || internalMessage
  const isActionLoading = isLoading ?? isPending

  const showMessage = (text: string) => {
    setInternalMessage(text)
    setTimeout(() => setInternalMessage(''), 3000)
  }

  const handleQuickVoteEmoji = (emojiToVote: string) => {
    if (onDevAction) {
      onDevAction(() => addQuickVoteAction(emojiToVote))
    } else {
      startTransition(async () => {
        const result = await addQuickVoteAction(emojiToVote)
        showMessage(result.message)
      })
    }
  }

  const handleQuickAdd = () => {
    if (onDevAction) {
      onDevAction(() => addQuickVoteAction(emoji))
    } else {
      startTransition(async () => {
        const result = await addQuickVoteAction(emoji)
        showMessage(result.message)
      })
    }
  }

  const handleGenerateRandom = () => {
    if (onDevAction) {
      onDevAction(() => generateRandomVotesAction(count))
    } else {
      startTransition(async () => {
        const result = await generateRandomVotesAction(count)
        showMessage(result.message)
      })
    }
  }

  const handleSeedEmoji = () => {
    if (onDevAction) {
      onDevAction(() => seedVotesForEmojiAction(seedEmoji, seedCount))
    } else {
      startTransition(async () => {
        const result = await seedVotesForEmojiAction(seedEmoji, seedCount)
        showMessage(result.message)
      })
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all votes?')) {
      if (onDevAction) {
        onDevAction(() => clearAllVotesAction())
      } else {
        startTransition(async () => {
          const result = await clearAllVotesAction()
          showMessage(result.message)
        })
      }
    }
  }

  const handleChangeMyVote = () => {
    if (onDevAction) {
      onDevAction(() => changeMyVoteAction(emoji))
    } else {
      startTransition(async () => {
        const result = await changeMyVoteAction(emoji)
        showMessage(result.message)
      })
    }
  }

  const handleClearMyVote = async () => {
    if (!session?.user?.fid) return

    try {
      await clearUserVote()
      showMessage('Your vote has been cleared.')
      mutate('/api/user-vote')
    } catch (error) {
      showMessage('Failed to clear your vote.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#050505] border border-neutral-800 rounded-2xl shadow-2xl p-5 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-light text-white">Development tools</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Message */}
        {displayMessage && (
          <div className={`mb-4 p-2.5 rounded-full text-sm font-medium border ${displayMessage.includes('Failed') || displayMessage.includes('Error') || displayMessage.includes('Unauthorized')
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
            }`}>
            {displayMessage}
          </div>
        )}

        <div className="space-y-5">
          {/* Quick Vote Rainbow */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Zap className="w-4 h-4" />
              Quick vote rainbow
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {QUICK_VOTE_EMOJIS.map((quickEmoji) => (
                <button
                  key={quickEmoji}
                  onClick={() => handleQuickVoteEmoji(quickEmoji)}
                  disabled={isActionLoading}
                  className="aspect-square w-8 h-8 text-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 border border-neutral-700 rounded-full transition-colors flex items-center justify-center"
                  title={`Vote for ${quickEmoji}`}
                >
                  {quickEmoji}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Quick Add */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Target className="w-4 h-4" />
              Custom emoji
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-11 h-8 text-center text-lg bg-neutral-900 border border-neutral-700 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-transparent text-white"
                placeholder="🎯"
                maxLength={4}
              />
              <button
                onClick={handleQuickAdd}
                disabled={isActionLoading}
                className="flex-1 h-8 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors border border-neutral-700 flex items-center justify-center"
              >
                {isActionLoading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Add vote'
                )}
              </button>
            </div>
          </div>

          {/* Generate Random */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Shuffle className="w-4 h-4" />
              Generate random votes
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                className="w-14 h-8 text-center bg-neutral-900 border border-neutral-700 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-transparent text-white text-sm"
                min="1"
                max="50"
              />
              <button
                onClick={handleGenerateRandom}
                disabled={isActionLoading}
                className="flex-1 h-8 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors border border-neutral-700 flex items-center justify-center"
              >
                {isActionLoading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>

          {/* Seed Emoji */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Target className="w-4 h-4" />
              Seed specific emoji
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={seedEmoji}
                onChange={(e) => setSeedEmoji(e.target.value)}
                className="w-11 h-8 text-center text-lg bg-neutral-900 border border-neutral-700 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-transparent text-white"
                placeholder="🔥"
                maxLength={4}
              />
              <input
                type="number"
                value={seedCount}
                onChange={(e) => setSeedCount(parseInt(e.target.value) || 10)}
                className="w-14 h-8 text-center bg-neutral-900 border border-neutral-700 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-transparent text-white text-sm"
                min="1"
                max="50"
              />
              <button
                onClick={handleSeedEmoji}
                disabled={isActionLoading}
                className="flex-1 h-8 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors border border-neutral-700 flex items-center justify-center"
              >
                {isActionLoading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Seed'
                )}
              </button>
            </div>
          </div>

          {/* My Vote Actions */}
          {session?.user && (
            <div className="space-y-2.5">
              <div className="text-sm font-medium text-neutral-300">My vote</div>
              <div className="flex gap-2">
                <button
                  onClick={handleChangeMyVote}
                  disabled={isActionLoading}
                  className="flex-1 h-8 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-black text-sm font-medium rounded-full transition-colors flex items-center justify-center"
                >
                  {isActionLoading ? (
                    <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    `Change to ${emoji}`
                  )}
                </button>
                <button
                  onClick={handleClearMyVote}
                  disabled={isActionLoading}
                  className="flex-1 h-8 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors border border-neutral-700 flex items-center justify-center"
                >
                  {isActionLoading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Clear'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-medium text-red-400 mb-2.5">
              <Trash2 className="w-4 h-4" />
              Danger zone
            </div>
            <button
              onClick={handleClearAll}
              disabled={isActionLoading}
              className="w-full h-8 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 text-sm font-medium rounded-full transition-colors border border-red-500/20 flex items-center justify-center"
            >
              {isActionLoading ? (
                <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                'Clear all votes'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-800 text-xs text-neutral-400 font-geist-mono">
          User: {session?.user?.fid ? `FID ${session.user.fid}` : 'Not signed in'}
        </div>
      </div>
    </div>
  )
} 