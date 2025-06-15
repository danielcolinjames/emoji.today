"use client"

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { X, Trash2, Zap, Shuffle, Target, Calendar, Clock } from 'lucide-react'
import { mutate } from 'swr'
import {
  addQuickVoteAction,
  generateRandomVotesAction,
  seedVotesForEmojiAction,
  clearAllVotesAction,
  changeMyVoteAction,
  addVoteWithDateTimeAction
} from '@/actions/dev-tools'
import { clearUserVote as clearUserVoteServer } from "@/actions/clearUserVote.server"
import { triggerVoteCacheUpdate } from '@/components/SWRCacheManager'
import { generateCommentaryAction } from '@/actions/generate-commentary'
import { getCurrentVotingDateString } from '@/lib/date-utils'

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
  const [customDate, setCustomDate] = useState(() => {
    return getCurrentVotingDateString()
  })
  const [customTime, setCustomTime] = useState('12:00')
  const [isPending, startTransition] = useTransition()

  // Commentary tester state
  const [commentaryDate, setCommentaryDate] = useState(() => {
    return getCurrentVotingDateString()
  })
  const [commentaryMilestone, setCommentaryMilestone] = useState('opening')
  const [generatedCommentary, setGeneratedCommentary] = useState('')

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

  const handleCustomDateTime = () => {
    if (onDevAction) {
      onDevAction(() => addVoteWithDateTimeAction(emoji, customDate, customTime))
    } else {
      startTransition(async () => {
        const result = await addVoteWithDateTimeAction(emoji, customDate, customTime)
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
      await clearUserVoteServer()
      triggerVoteCacheUpdate()
      showMessage('Your vote has been cleared.')
      mutate('/api/user-vote')
    } catch (error) {
      showMessage('Failed to clear your vote.')
    }
  }

  // Commentary tester handler
  const handleGenerateCommentary = () => {
    if (onDevAction) {
      onDevAction(async () => {
        const res = await generateCommentaryAction(commentaryDate, commentaryMilestone as any)
        setGeneratedCommentary(res.commentary || '')
        return { success: true, message: 'Generated' }
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#050505] border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-3xl font-light text-white">Development Panel</h2>
            <p className="text-sm text-neutral-400 font-geist-mono mt-1">Testing & Debug Tools</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Message */}
        {displayMessage && (
          <div className="p-6 border-b border-neutral-800">
            <div className={`p-3 rounded-xl text-sm font-medium border ${displayMessage.includes('Failed') || displayMessage.includes('Error') || displayMessage.includes('Unauthorized')
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
              {displayMessage}
            </div>
          </div>
        )}

        <div className="p-6 space-y-8">
          {/* Quick Vote Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-light text-white">Quick Actions</h3>
                <p className="text-sm text-neutral-500">One-click voting for today</p>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {QUICK_VOTE_EMOJIS.map((quickEmoji) => (
                <button
                  key={quickEmoji}
                  onClick={() => handleQuickVoteEmoji(quickEmoji)}
                  disabled={isActionLoading}
                  className="aspect-square w-full h-12 text-xl bg-neutral-900/50 hover:bg-neutral-800/50 disabled:opacity-50 border border-neutral-700/50 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 hover:border-neutral-600"
                  title={`Vote for ${quickEmoji}`}
                >
                  {quickEmoji}
                </button>
              ))}
            </div>
          </section>

          {/* Custom Vote Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-light text-white">Custom Votes</h3>
                <p className="text-sm text-neutral-500">Precise control over vote data</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Today's Custom Vote */}
              <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-medium text-neutral-300">Vote for Today</div>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="w-16 h-12 text-center text-xl bg-neutral-900 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-200"
                      placeholder="🎯"
                      maxLength={4}
                    />
                  </div>
                  <button
                    onClick={handleQuickAdd}
                    disabled={isActionLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Add Vote Now'
                    )}
                  </button>
                </div>
              </div>

              {/* Custom Date/Time Vote */}
              <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <div className="text-sm font-medium text-neutral-300">Vote with Custom Date & Time</div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="w-full h-12 text-center text-xl bg-neutral-900 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-200"
                      placeholder="🎯"
                      maxLength={4}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-12 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full h-12 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={handleCustomDateTime}
                    disabled={isActionLoading}
                    className="h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
                <div className="text-xs text-neutral-500 mt-2 font-geist-mono">
                  Date: YYYY-MM-DD, Time: HH:MM (24h UTC)
                </div>
              </div>
            </div>
          </section>

          {/* Bulk Operations Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-light text-white">Bulk Operations</h3>
                <p className="text-sm text-neutral-500">Generate test data at scale</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Random Votes */}
              <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4">
                <div className="text-sm font-medium text-neutral-300 mb-3">Random Votes</div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                    className="w-20 h-10 text-center bg-neutral-900 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white text-sm transition-all duration-200"
                    min="1"
                    max="50"
                  />
                  <button
                    onClick={handleGenerateRandom}
                    disabled={isActionLoading}
                    className="flex-1 h-10 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
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
              <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4">
                <div className="text-sm font-medium text-neutral-300 mb-3">Seed Emoji</div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={seedEmoji}
                    onChange={(e) => setSeedEmoji(e.target.value)}
                    className="w-12 h-10 text-center text-lg bg-neutral-900 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white transition-all duration-200"
                    placeholder="🔥"
                    maxLength={4}
                  />
                  <input
                    type="number"
                    value={seedCount}
                    onChange={(e) => setSeedCount(parseInt(e.target.value) || 10)}
                    className="w-16 h-10 text-center bg-neutral-900 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white text-sm transition-all duration-200"
                    min="1"
                    max="50"
                  />
                  <button
                    onClick={handleSeedEmoji}
                    disabled={isActionLoading}
                    className="flex-1 h-10 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
                  >
                    {isActionLoading ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Seed'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Personal Actions */}
          {session?.user && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-white">Personal Actions</h3>
                  <p className="text-sm text-neutral-500">Manage your own vote</p>
                </div>
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleChangeMyVote}
                    disabled={isActionLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      `Change my vote to ${emoji}`
                    )}
                  </button>
                  <button
                    onClick={handleClearMyVote}
                    disabled={isActionLoading}
                    className="flex-1 h-12 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-neutral-700 flex items-center justify-center"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Clear my vote'
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-light text-white">Danger Zone</h3>
                <p className="text-sm text-neutral-500">Destructive operations</p>
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <button
                onClick={handleClearAll}
                disabled={isActionLoading}
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                {isActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Clear all votes for today'
                )}
              </button>
            </div>
          </section>

          {/* Commentary Tester */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-light text-white">Commentary Tester</h3>
                <p className="text-sm text-neutral-500">Generate commentary for any day/milestone</p>
              </div>
            </div>

            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 items-center">
                <input type="date" value={commentaryDate} onChange={e => setCommentaryDate(e.target.value)} className="w-full h-10 px-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm" />
                <select value={commentaryMilestone} onChange={e => setCommentaryMilestone(e.target.value)} className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm px-2">
                  {['opening', '1hour', 'halfway', '6hours_left', '3hours_left', 'final_hour', 'final_minutes', 'daily_summary'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={handleGenerateCommentary} disabled={isActionLoading} className="h-10 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg text-sm">Generate</button>
              </div>
              {generatedCommentary && (
                <textarea readOnly value={generatedCommentary} className="w-full h-32 bg-neutral-950 text-white text-xs p-2 rounded-lg border border-neutral-700" />
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 border-t border-neutral-800 mt-8">
          <div className="text-xs text-neutral-500 font-geist-mono text-center">
            Authenticated as FID {session?.user?.fid || 'Not signed in'} • Development Environment
          </div>
        </div>
      </div>
    </div>
  )
} 