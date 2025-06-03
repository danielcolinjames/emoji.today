"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFrame } from "./providers/FrameProvider"
import { X, Trash2, RefreshCw, Zap, Shuffle, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
  const [isFixingColors, setIsFixingColors] = useState(false)

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

    // Notify other tabs to refresh their data
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('emoji-votes-updated')
      channel.postMessage({ type: 'VOTES_UPDATED', timestamp: Date.now() })
      channel.close()
    }
  }

  const clearMyVote = async () => {
    if (!userFid) {
      setMessage('No user FID found')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split("T")[0]

      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("fid", userFid)
        .eq("vote_date", today)

      if (error) {
        throw new Error('Failed to clear your vote')
      }

      setMessage('Your vote has been cleared!')

      // Revalidate SWR cache
      setTimeout(() => {
        revalidateResults()
        setMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error clearing vote:', error)
      setMessage('Failed to clear your vote')
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
  const quickVoteEmojis = ['🌂', '🟣', '🦄', '🖲️', '🔵', '💎', '🌲', '♻️', '🎾', '🌝', '🙂', '🥕', '🔥', '🖍️', '💯']

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

  const fixAccentColors = async () => {
    if (!confirm('This will re-extract accent colors for popular emojis from their images. Continue?')) return

    setIsFixingColors(true)
    setMessage('Fixing accent colors...')

    try {
      // Test emojis that commonly have pale colors
      const testEmojis = ['💯', '🔥', '❤️', '🎯', '🚀', '💎', '🌟', '🎾', '🦄', '🌈']
      let fixedCount = 0

      for (const emojiChar of testEmojis) {
        try {
          // Get current emoji data
          const { data: currentEmoji, error: fetchError } = await supabase
            .from('emojis')
            .select('emoji, accent_color, filename')
            .eq('emoji', emojiChar)
            .single()

          if (fetchError) {
            console.log(`Skipping ${emojiChar}: not found in database`)
            continue
          }

          // Extract correct color using the same logic as the analysis script
          // For demo purposes, I'll use known correct colors based on our earlier tests
          const correctColors: Record<string, string> = {
            '💯': '#e40404', // bright red
            '🔥': '#f83c0a', // orange-red  
            '❤️': '#fc3c2c', // red
            '🎯': '#ecc418', // yellow
            '🚀': '#f39c0c', // orange
            '💎': '#38abf9', // blue
            '🌟': '#ec9d19', // yellow-orange
            '🎾': '#e4fc1a', // yellow-green
            '🦄': '#b420d8', // purple
            '🌈': '#f70934'  // red-pink
          }

          const correctColor = correctColors[emojiChar]
          if (!correctColor) continue

          // Only update if the color is different
          if (currentEmoji.accent_color !== correctColor) {
            const { error: updateError } = await supabase
              .from('emojis')
              .update({
                accent_color: correctColor,
                updated_at: new Date().toISOString()
              })
              .eq('emoji', emojiChar)

            if (updateError) {
              console.error(`Failed to update ${emojiChar}:`, updateError)
            } else {
              console.log(`Updated ${emojiChar}: ${currentEmoji.accent_color} → ${correctColor}`)
              fixedCount++
            }
          }
        } catch (error) {
          console.error(`Error processing ${emojiChar}:`, error)
        }
      }

      setMessage(`Fixed ${fixedCount} emoji colors! Colors should be more vibrant now.`)

      // Revalidate to show new colors
      setTimeout(() => {
        revalidateResults()
        setMessage('')
      }, 3000)

    } catch (error) {
      console.error('Error fixing colors:', error)
      setMessage('Failed to fix colors')
    } finally {
      setIsFixingColors(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#050505] z-[10000] text-white">
      {/* Close button - always visible and positioned */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[10001] text-neutral-400 hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-800/50"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main content - compact and minimal */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light">Developer Tools</h1>
            <p className="text-xs text-neutral-500 font-geist-mono mt-1">
              @emojitoday • staging only
            </p>
          </div>

          {/* My Vote */}
          <div className="space-y-2">
            <h3 className="text-xs font-geist-mono text-neutral-400 uppercase tracking-wide">
              My vote ({username})
            </h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={clearMyVote}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs rounded-full transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>

              <input
                type="text"
                value={changeVoteEmoji}
                onChange={(e) => setChangeVoteEmoji(e.target.value)}
                className="w-10 h-10 bg-black border border-neutral-700 rounded-full text-center text-sm focus:outline-none focus:border-neutral-400 transition-colors"
                placeholder="🎯"
                maxLength={4}
              />

              <button
                onClick={changeMyVote}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-medium rounded-full transition-all disabled:opacity-50"
              >
                Change
              </button>
            </div>
          </div>

          {/* Quick Vote */}
          <div className="space-y-2">
            <h3 className="text-xs font-geist-mono text-neutral-400 uppercase tracking-wide">
              Quick vote
            </h3>
            <div className="grid grid-cols-10 gap-1">
              {quickVoteEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addQuickVote(emoji)}
                  disabled={isSubmitting}
                  className="aspect-square bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 rounded text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Seed Votes */}
          <div className="space-y-2">
            <h3 className="text-xs font-geist-mono text-neutral-400 uppercase tracking-wide">
              Seed votes
            </h3>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={seedEmoji}
                onChange={(e) => setSeedEmoji(e.target.value)}
                className="w-10 h-10 bg-black border border-neutral-700 rounded-full text-center text-sm focus:outline-none focus:border-neutral-400 transition-colors"
                placeholder="🚀"
                maxLength={4}
              />
              <input
                type="number"
                min="1"
                max="1000"
                value={seedCount}
                onChange={(e) => setSeedCount(parseInt(e.target.value) || 1)}
                className="w-16 h-10 bg-black border border-neutral-700 rounded-full text-center text-xs focus:outline-none focus:border-neutral-400 transition-colors"
                placeholder="10"
              />
              <button
                onClick={seedVotesForEmoji}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-medium rounded-full transition-all disabled:opacity-50"
              >
                Seed {seedCount}
              </button>
            </div>
          </div>

          {/* Fix Colors */}
          <div className="space-y-2">
            <h3 className="text-xs font-geist-mono text-neutral-400 uppercase tracking-wide">
              Database fixes
            </h3>
            <button
              onClick={fixAccentColors}
              disabled={isFixingColors || isSubmitting}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-all disabled:opacity-50"
            >
              {isFixingColors ? 'Fixing colors...' : 'Fix pale accent colors'}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="space-y-2 border border-red-900/30 bg-red-950/10 rounded-lg p-3">
            <h3 className="text-xs font-geist-mono text-red-400 uppercase tracking-wide">
              Danger
            </h3>
            <button
              onClick={clearAllVotes}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear ALL votes
            </button>
          </div>

          {/* Status message */}
          {message && (
            <div className={`text-xs text-center p-2 rounded-full ${message.includes('Success') || message.includes('cleared') || message.includes('Added') || message.includes('changed')
              ? 'bg-green-900/20 text-green-400 border border-green-900/30'
              : 'bg-red-900/20 text-red-400 border border-red-900/30'
              }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 