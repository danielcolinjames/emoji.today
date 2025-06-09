"use client";

import { useState, useEffect } from 'react';
import { LeaderboardUser, getLongestStreakLeaderboard, getBestAccuracyLeaderboard, getBiggestOGsLeaderboard } from '@/lib/actions';
import LoadingSpinner from '@/components/LoadingSpinner';

type TabType = 'streak' | 'accuracy' | 'ogs';

interface TabData {
  id: TabType;
  label: string;
  description: string;
}

const tabs: TabData[] = [
  {
    id: 'streak',
    label: 'Streak',
    description: 'Users with the most consecutive voting days'
  },
  {
    id: 'accuracy',
    label: 'Win Rate',
    description: 'Voters with the best win/loss record (min. 2 votes)'
  },
  {
    id: 'ogs',
    label: 'OG',
    description: 'Early Farcaster users (lowest FIDs)'
  }
];

function LeaderboardItem({ user, rank, tabType, isLast }: { user: LeaderboardUser; rank: number; tabType: TabType; isLast: boolean }) {
  const [imageError, setImageError] = useState(false);

  const getValueDisplay = () => {
    switch (tabType) {
      case 'streak':
        return `${user.value} day${user.value !== 1 ? 's' : ''}`;
      case 'accuracy':
        return `${user.value}/${user.secondaryValue} wins`;
      case 'ogs':
        return `FID ${user.value}`;
      default:
        return user.value;
    }
  };

  const getSecondaryDisplay = () => {
    switch (tabType) {
      case 'streak':
        return `${user.secondaryValue} total votes`;
      case 'accuracy':
        const winRate = user.secondaryValue ? Math.round((user.value / user.secondaryValue) * 100) : 0;
        return `${winRate}% win rate`;
      case 'ogs':
        return `${user.secondaryValue} vote${user.secondaryValue !== 1 ? 's' : ''}`;
      default:
        return user.secondaryValue;
    }
  };

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName = user.displayName || user.username || `User ${user.fid}`;

  return (
    <div className={`flex items-start gap-3 py-3 ${!isLast ? 'border-b border-neutral-800/30' : ''}`} style={!isLast ? { borderBottomColor: 'rgba(38, 38, 38, 0.3)' } : {}}>
      {/* Rank */}
      <div className="flex-shrink-0 w-6 pt-1">
        <span className="text-sm font-light text-neutral-400 font-geist-mono">
          {rank}
        </span>
      </div>

      {/* Profile Picture */}
      <div className="flex-shrink-0">
        {user.pfpUrl && !imageError ? (
          <img
            src={user.pfpUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-200 text-xs font-medium">
            {getInitials(displayName)}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate text-sm">
          {displayName}
        </div>
        <div className="text-xs text-neutral-500 font-geist-mono">
          FID {user.fid}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <div className="text-white font-medium text-sm">
          {getValueDisplay()}
        </div>
        <div className="text-xs text-neutral-400">
          {getSecondaryDisplay()}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardClient() {
  const [activeTab, setActiveTab] = useState<TabType>('streak');
  const [data, setData] = useState<Record<TabType, LeaderboardUser[]>>({
    streak: [],
    accuracy: [],
    ogs: []
  });
  const [loading, setLoading] = useState<Record<TabType, boolean>>({
    streak: false,
    accuracy: false,
    ogs: false
  });
  const [error, setError] = useState<Record<TabType, string | null>>({
    streak: null,
    accuracy: null,
    ogs: null
  });

  const loadData = async (tabType: TabType) => {
    if (data[tabType].length > 0) return; // Already loaded

    setLoading(prev => ({ ...prev, [tabType]: true }));
    setError(prev => ({ ...prev, [tabType]: null }));

    try {
      let result: LeaderboardUser[] = [];

      switch (tabType) {
        case 'streak':
          result = await getLongestStreakLeaderboard(20);
          break;
        case 'accuracy':
          result = await getBestAccuracyLeaderboard(20);
          break;
        case 'ogs':
          result = await getBiggestOGsLeaderboard(20);
          break;
      }

      setData(prev => ({ ...prev, [tabType]: result }));
    } catch (err) {
      console.error(`Error loading ${tabType} leaderboard:`, err);
      setError(prev => ({ ...prev, [tabType]: 'Failed to load leaderboard data' }));
    } finally {
      setLoading(prev => ({ ...prev, [tabType]: false }));
    }
  };

  // Load initial tab data
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-0.5 p-0.5 bg-neutral-900/50 rounded-xl border border-neutral-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${activeTab === tab.id
              ? 'bg-white text-black'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <div className="text-center">
        <p className="text-neutral-400 text-xs">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Content */}
      <div className="bg-neutral-900/20 rounded-xl px-4">
        {loading[activeTab] ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size={48} />
          </div>
        ) : error[activeTab] ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error[activeTab]}</div>
            <button
              onClick={() => loadData(activeTab)}
              className="text-white hover:text-neutral-300 underline"
            >
              Try again
            </button>
          </div>
        ) : data[activeTab].length > 0 ? (
          data[activeTab].map((user, index) => (
            <LeaderboardItem
              key={user.fid}
              user={user}
              rank={index + 1}
              tabType={activeTab}
              isLast={index === data[activeTab].length - 1}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
} 