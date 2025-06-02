"use client"

import { useState } from 'react'
import { DevPanel } from './DevPanel'

export function EnvironmentBadge() {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false)

  // Don't show in production
  if (!env || env === 'production' || (process.env.NODE_ENV === 'production' && env !== 'staging')) return null

  const getEnvColor = () => {
    switch (env) {
      case 'staging':
        return 'border-b border-yellow-500/50 bg-yellow-500/20 text-white'
      case 'development':
        return 'border-b border-blue-500/50 bg-blue-500/20 text-white'
      default:
        return 'border-b border-red-500/50 bg-red-500/20 text-white'
    }
  }

  const handleClick = () => {
    if (env === 'staging') {
      setIsDevPanelOpen(true)
    }
  }

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 ${getEnvColor()} text-center z-[9999] ${env === 'staging' ? 'cursor-pointer hover:opacity-80 font-geist-mono' : ''}`}
        style={{ fontSize: '8px', height: '8px', lineHeight: '8px' }}
        onClick={handleClick}
      >
        <span className="font-bold tracking-wider">{env.toUpperCase()}</span>
      </div>
      <DevPanel isOpen={isDevPanelOpen} onClose={() => setIsDevPanelOpen(false)} />
    </>
  )
}
