# Vote Simulation Script

## Overview
The `simulate-realistic-votes.ts` script creates realistic voting patterns with votes coming in at random times, for random emojis, but concentrated on obvious winners.

## Features
- **350 simulation users** (85% participation = ~297 votes)
- **Weighted emoji distribution** toward obvious winners
- **Time-based voting patterns** (early, midday, evening)
- **5% random emoji chance** for variety
- **Chronological vote insertion** with realistic timing

## Usage

### Batch Mode (Default)
Creates all votes instantly with timestamps spread throughout the day:
```bash
npm run simulate-votes
```

### Continuous Mode
Simulates votes trickling in over time:
```bash
npm run simulate-votes continuous [interval_minutes] [duration_minutes]
```

**Examples:**
```bash
# 1 vote per minute for 30 minutes
npm run simulate-votes continuous 1 30

# 1 vote every ~2 minutes for 1 hour  
npm run simulate-votes continuous 2 60

# 1 vote every 30 seconds for 15 minutes
npm run simulate-votes continuous 0.5 15
```

## Emoji Weights
- 🔥 Fire: 30% (evening votes)
- 😂 Laughing: 25% (midday votes)
- ❤️ Heart: 20% (uniform timing)
- 🚀 Rocket: 8% (early votes)
- 🎉 Party: 6% (evening votes)
- 💯 100: 5% (midday votes)
- 🤔 Thinking: 4% (uniform timing)
- 🌟 Star: 2% (early votes)
- Random emoji: 5% chance

## User Ranges
- **Simulation users**: FID 300001-300350
- **Continuous users**: FID 400001-400050

## Output
The script provides detailed progress and results:
- User creation confirmation
- Vote insertion progress
- Final results with percentages
- First/last vote times for verification 