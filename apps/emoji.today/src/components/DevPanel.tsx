"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFrame } from "./providers/FrameProvider"
import { X, Trash2, RefreshCw, Zap, Shuffle, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { clearUserVote } from '@/lib/actions'
import { mutate } from 'swr'

interface DevPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DevPanel({ isOpen, onClose }: DevPanelProps) {
  const { data: session } = useSession()
  const { context } = useFrame()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [voteCount, setVoteCount] = useState(5)
  const [changeVoteEmoji, setChangeVoteEmoji] = useState('🎯')
  const [seedEmoji, setSeedEmoji] = useState('🚀')
  const [seedCount, setSeedCount] = useState(10)

  // Get username from context
  const username = context?.user?.username
  const userFid = session?.user?.fid

  // Only show for emojitoday user in staging
  if (!username || username !== 'emojitoday' || process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') {
    return null
  }

  if (!isOpen) return null

  const revalidateResults = () => {
    // Revalidate the SWR cache for voting results
    // Use mutate without a filter to revalidate all SWR caches
    mutate(() => true)
  }

  const clearMyVote = async () => {
    if (!userFid) {
      setMessage('No user FID found')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await clearUserVote()

      setMessage(result.message)

      // Revalidate SWR cache
      setTimeout(() => {
        revalidateResults()
        setMessage('')
      }, 1500)
    } catch (error) {
      console.error('[clearMyVote] Error clearing vote:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to clear your vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeMyVote = async () => {
    if (!userFid) {
      setMessage('No user FID found')
      return
    }

    if (!changeVoteEmoji) {
      setMessage('Please enter an emoji')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]

      // Update the vote
      const { error } = await supabase
        .from("votes")
        .update({ emoji: changeVoteEmoji })
        .eq("fid", userFid)
        .eq("vote_date", today)

      if (error) {
        throw new Error('Failed to change your vote')
      }

      setMessage(`Vote changed to ${changeVoteEmoji}!`)

      // Revalidate SWR cache
      setTimeout(() => {
        revalidateResults()
        setMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error changing vote:', error)
      setMessage('Failed to change your vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const seedRandomVotes = async () => {
    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]

      // Common emojis for random selection
      const commonEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🤡', '🥳', '🥴', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '💀', '☠️', '💩', '🤖', '👽', '👻', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '💫', '⭐', '🌟', '💥', '💢', '💯', '🎯', '🚀', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '🌊', '🎮', '🎯', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎳', '🎯', '🎮', '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🧇', '🥞', '🧈', '🍳', '🥖', '🥨', '🥯', '🥐', '🍞', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥫', '🍖', '🍗', '🥩', '🍠', '🥟', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🦪', '🍣', '🍤', '🍥', '🥮', '🍢', '🧆', '🥘', '🍲', '🍝', '🥣', '🥧', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍡', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾']

      const votes = []

      for (let i = 0; i < voteCount; i++) {
        const emoji = commonEmojis[Math.floor(Math.random() * commonEmojis.length)]
        const fakeFid = Math.floor(Math.random() * 100000) + 1
        votes.push({
          emoji,
          fid: fakeFid,
          vote_date: today,
          username: `user${fakeFid}`
        })
      }

      // First, upsert test users and get their IDs
      const { data: upsertedUsers, error: userError } = await supabase
        .from("users")
        .upsert(
          votes.map(v => ({
            fid: v.fid,
            username: v.username,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'fid' }
        )
        .select('id, fid')

      if (userError) {
        console.error('Failed to upsert users:', userError)
        throw new Error('Failed to create test users')
      }

      // Create a mapping of FID to user ID
      const fidToUserId = new Map()
      upsertedUsers?.forEach(user => {
        fidToUserId.set(user.fid, user.id)
      })

      // If we didn't get user IDs back, fetch them
      if (!upsertedUsers || upsertedUsers.length === 0) {
        const { data: fetchedUsers, error: fetchError } = await supabase
          .from("users")
          .select('id, fid')
          .in('fid', votes.map(v => v.fid))

        if (fetchError) {
          console.error('Failed to fetch users:', fetchError)
          throw new Error('Failed to fetch user IDs')
        }

        fetchedUsers?.forEach(user => {
          fidToUserId.set(user.fid, user.id)
        })
      }

      // Then insert votes with proper user_id (UUID)
      const voteData = votes.map(v => ({
        user_id: fidToUserId.get(v.fid),
        fid: v.fid,
        emoji: v.emoji,
        vote_date: v.vote_date
      })).filter(v => v.user_id) // Only include votes where we have a user_id

      if (voteData.length === 0) {
        throw new Error('No valid user IDs found')
      }

      const { error: voteError } = await supabase
        .from("votes")
        .insert(voteData)

      if (voteError) {
        throw new Error(`Failed to insert votes: ${voteError.message}`)
      }

      setMessage(`Added ${voteData.length} random votes!`)

      setTimeout(() => {
        revalidateResults()
      }, 1500)
    } catch (error) {
      console.error('Error seeding random votes:', error)
      setMessage('Failed to seed random votes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const seedVotesForEmoji = async () => {
    if (!seedEmoji) {
      setMessage('Please enter an emoji')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]
      const votes = []
      let skippedUsers = 0
      let successfulVotes = 0

      // Generate unique FIDs to avoid conflicts
      const usedFids = new Set<number>()

      for (let i = 0; i < seedCount; i++) {
        let fakeFid: number
        // Keep generating until we get a unique FID
        do {
          fakeFid = Math.floor(Math.random() * 100000) + 1
        } while (usedFids.has(fakeFid))

        usedFids.add(fakeFid)

        votes.push({
          emoji: seedEmoji,
          fid: fakeFid,
          vote_date: today,
          username: `user${fakeFid}`
        })
      }

      // First, check which users already exist
      const fids = votes.map(v => v.fid)
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("id, fid")
        .in("fid", fids)

      if (checkError) {
        console.error('Error checking existing users:', checkError)
      }

      const existingFidsMap = new Map()
      existingUsers?.forEach(user => {
        existingFidsMap.set(user.fid, user.id)
      })

      // Insert only new users
      const newUsers = votes.filter(v => !existingFidsMap.has(v.fid))

      if (newUsers.length > 0) {
        const { data: insertedUsers, error: insertError } = await supabase
          .from("users")
          .insert(
            newUsers.map(v => ({
              fid: v.fid,
              username: v.username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          )
          .select('id, fid')

        if (insertError) {
          console.error('Error inserting new users:', insertError)
          throw new Error('Failed to create users')
        }

        // Add newly inserted users to the map
        insertedUsers?.forEach(user => {
          existingFidsMap.set(user.fid, user.id)
        })
      }

      // Check which votes already exist for today
      const { data: existingVotes, error: voteCheckError } = await supabase
        .from("votes")
        .select("fid")
        .in("fid", fids)
        .eq("vote_date", today)

      if (voteCheckError) {
        console.error('Error checking existing votes:', voteCheckError)
      }

      const existingVoteFids = new Set(existingVotes?.map(v => v.fid) || [])

      // Filter out votes that already exist
      const newVotes = votes.filter(v => !existingVoteFids.has(v.fid))
      skippedUsers = votes.length - newVotes.length

      // Insert only new votes
      if (newVotes.length > 0) {
        const voteData = newVotes.map(v => ({
          user_id: existingFidsMap.get(v.fid),
          fid: v.fid,
          emoji: v.emoji,
          vote_date: v.vote_date
        })).filter(v => v.user_id) // Only include votes where we have a user_id

        if (voteData.length === 0) {
          throw new Error('No valid user IDs found')
        }

        const { data: insertedVotes, error: voteError } = await supabase
          .from("votes")
          .insert(voteData)
          .select()

        if (voteError) {
          console.error('Vote insertion error details:', voteError)
          throw new Error(`Failed to insert votes: ${voteError.message || JSON.stringify(voteError)}`)
        }

        successfulVotes = insertedVotes?.length || 0
      }

      if (successfulVotes === 0 && skippedUsers === votes.length) {
        setMessage(`All ${skippedUsers} users already voted today`)
      } else {
        setMessage(`Added ${successfulVotes} votes for ${seedEmoji}!${skippedUsers > 0 ? ` (${skippedUsers} users already voted)` : ''}`)
      }

      setTimeout(() => {
        revalidateResults()
      }, 2000)
    } catch (error) {
      console.error('Error seeding votes for emoji:', error)
      setMessage(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateRandomVotes = async () => {
    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]

      // Generate votes with random or incrementing FIDs to avoid conflicts
      const votes = []
      const baseFid = Math.floor(Math.random() * 900000) + 100000 // Random starting FID (6 digits)

      // Use quickVoteEmojis for controlled randomness
      for (let i = 0; i < voteCount; i++) {
        const emoji = quickVoteEmojis[Math.floor(Math.random() * quickVoteEmojis.length)]
        const fakeFid = baseFid + i
        votes.push({
          emoji,
          fid: fakeFid,
          vote_date: today,
          username: `testuser${fakeFid}`
        })
      }

      // First, upsert test users and get their IDs
      const { data: upsertedUsers, error: userError } = await supabase
        .from("users")
        .upsert(
          votes.map(v => ({
            fid: v.fid,
            username: v.username,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'fid' }
        )
        .select('id, fid')

      if (userError) {
        console.error('Failed to upsert test users:', userError)
        throw new Error('Failed to create test users')
      }

      // Create a mapping of FID to user ID
      const fidToUserId = new Map()
      upsertedUsers?.forEach(user => {
        fidToUserId.set(user.fid, user.id)
      })

      // If we didn't get user IDs back, fetch them
      if (!upsertedUsers || upsertedUsers.length === 0) {
        const { data: fetchedUsers, error: fetchError } = await supabase
          .from("users")
          .select('id, fid')
          .in('fid', votes.map(v => v.fid))

        if (fetchError) {
          console.error('Failed to fetch users:', fetchError)
          throw new Error('Failed to fetch user IDs')
        }

        fetchedUsers?.forEach(user => {
          fidToUserId.set(user.fid, user.id)
        })
      }

      // Then insert votes with proper user_id (UUID)
      const voteData = votes.map(v => ({
        user_id: fidToUserId.get(v.fid),
        fid: v.fid,
        emoji: v.emoji,
        vote_date: v.vote_date
      })).filter(v => v.user_id) // Only include votes where we have a user_id

      if (voteData.length === 0) {
        throw new Error('No valid user IDs found')
      }

      const { error: voteError } = await supabase
        .from("votes")
        .insert(voteData)

      if (voteError) {
        throw new Error(`Failed to insert votes: ${voteError.message}`)
      }

      setMessage(`Successfully added ${voteData.length} test votes!`)

      // Refresh the page after a short delay
      setTimeout(() => {
        revalidateResults()
      }, 1500)
    } catch (error) {
      console.error('Error generating votes:', error)
      setMessage('Failed to generate test votes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearAllVotes = async () => {
    if (!confirm('Are you sure you want to clear ALL votes for today?')) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]

      // Delete all votes for today
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("vote_date", today)

      if (error) {
        throw new Error('Failed to clear votes')
      }

      setMessage('All votes cleared!')

      setTimeout(() => {
        revalidateResults()
      }, 1500)
    } catch (error) {
      console.error('Error clearing votes:', error)
      setMessage('Failed to clear votes')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Popular emojis for quick voting
  const quickVoteEmojis = ['🔥', '😂', '❤️', '👍', '😱']

  const addQuickVote = async (emoji: string) => {
    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]
      const fakeFid = Math.floor(Math.random() * 100000) + 1

      // First, create the user
      const { data: upsertedUser, error: userError } = await supabase
        .from("users")
        .upsert({
          fid: fakeFid,
          username: `user${fakeFid}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'fid' })
        .select('id, fid')
        .single()

      if (userError) {
        console.error('Failed to create user:', userError)
        throw new Error('Failed to create user')
      }

      // Then insert the vote
      const { error: voteError } = await supabase
        .from("votes")
        .insert({
          user_id: upsertedUser.id,
          fid: fakeFid,
          emoji: emoji,
          vote_date: today
        })

      if (voteError) {
        throw new Error(`Failed to insert vote: ${voteError.message}`)
      }

      setMessage(`Added 1 vote for ${emoji}!`)

      // Revalidate SWR cache
      setTimeout(() => {
        revalidateResults()
        setMessage('')
      }, 1000)
    } catch (error) {
      console.error('Error adding quick vote:', error)
      setMessage('Failed to add vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="bg-[#050505] border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-white">Dev Panel</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* My Vote Actions */}
          <div className="bg-neutral-900 rounded-xl p-5">
            <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              My Vote
            </h3>
            <div className="space-y-3">
              <button
                onClick={clearMyVote}
                disabled={isSubmitting}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear My Vote Today
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={changeVoteEmoji}
                  onChange={(e) => setChangeVoteEmoji(e.target.value)}
                  className="flex-1 bg-black border border-neutral-700 rounded-full px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-neutral-500 transition-colors"
                  placeholder="🎯"
                  maxLength={4}
                />
                <button
                  onClick={changeMyVote}
                  disabled={isSubmitting}
                  className="bg-white hover:bg-neutral-200 text-black font-medium py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Vote
                </button>
              </div>
            </div>
          </div>

          {/* Generate Test Votes */}
          <div className="bg-neutral-900 rounded-xl p-5">
            <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Generate Test Votes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Number of votes
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={voteCount}
                  onChange={(e) => setVoteCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Quick vote (adds 1 vote immediately)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {quickVoteEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => addQuickVote(emoji)}
                      disabled={isSubmitting}
                      className="bg-black hover:bg-neutral-800 border border-neutral-700 py-3 rounded-lg text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={generateRandomVotes}
                  disabled={isSubmitting}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Add {voteCount} Test Votes
                </button>

                <button
                  onClick={seedRandomVotes}
                  disabled={isSubmitting}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  {voteCount} Random Votes
                </button>
              </div>
            </div>
          </div>

          {/* Seed Specific Emoji */}
          <div className="bg-neutral-900 rounded-xl p-5">
            <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Seed Votes for Specific Emoji
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={seedEmoji}
                onChange={(e) => setSeedEmoji(e.target.value)}
                className="w-24 bg-black border border-neutral-700 rounded-full px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="🚀"
                maxLength={4}
              />
              <input
                type="number"
                min="1"
                max="1000"
                value={seedCount}
                onChange={(e) => setSeedCount(parseInt(e.target.value) || 1)}
                className="flex-1 bg-black border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="Number of votes"
              />
              <button
                onClick={seedVotesForEmoji}
                disabled={isSubmitting}
                className="bg-white hover:bg-neutral-200 text-black font-medium py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seed
              </button>
            </div>
          </div>

          {/* Clear All */}
          <div className="border border-red-900/50 bg-red-950/20 rounded-xl p-5">
            <h3 className="text-lg font-light text-white mb-4">Danger Zone</h3>
            <button
              onClick={clearAllVotes}
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear ALL Votes Today
            </button>
          </div>

          {message && (
            <div className={`text-sm text-center p-3 rounded-lg ${message.includes('Success') || message.includes('cleared') || message.includes('Added') || message.includes('changed')
              ? 'bg-green-900/20 text-green-400'
              : 'bg-red-900/20 text-red-400'
              }`}>
              {message}
            </div>
          )}

          <div className="text-xs text-neutral-500 text-center pt-2">
            This panel is only visible to @emojitoday in staging
          </div>
        </div>
      </div>
    </div>
  )
} 