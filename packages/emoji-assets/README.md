# 🎭 Emoji Assets Management System

A comprehensive emoji data management system for emoji.today, featuring Unicode 16.0 support, image processing, color extraction, and NFT-ready assets.

## 📋 Overview

This package manages:
- **1,932 emojis** from Unicode 16.0 (latest 2024 release)
- **Comprehensive metadata** with searchable keywords
- **Image assets** with automatic color extraction
- **Database integration** with Supabase
- **NFT-ready image processing**

## 🗂️ Database Schema

The system uses a comprehensive `emojis` table in Supabase:

```sql
CREATE TABLE emojis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core emoji data
  emoji TEXT NOT NULL UNIQUE,              -- The actual emoji character
  unified TEXT NOT NULL UNIQUE,            -- Unicode codepoint (e.g., "1F600")
  non_qualified TEXT,                      -- Non-qualified version if exists
  
  -- Names and descriptions
  name TEXT NOT NULL,                      -- Official Unicode name (e.g., "GRINNING FACE")
  short_name TEXT NOT NULL,                -- Primary short name (e.g., "grinning")
  short_names TEXT[] NOT NULL DEFAULT '{}',-- All known short names
  
  -- Search and categorization
  keywords TEXT[] NOT NULL DEFAULT '{}',   -- Search keywords
  category TEXT NOT NULL,                  -- Main category (e.g., "Smileys & Emotion")
  subcategory TEXT,                        -- Subcategory (e.g., "face-smiling")
  
  -- Technical details
  sort_order INTEGER NOT NULL,             -- Official Unicode sort order
  added_in TEXT NOT NULL,                  -- Emoji version (e.g., "16.0")
  unicode_version TEXT NOT NULL,           -- Unicode version (e.g., "16.0")
  
  -- Visual properties
  accent_color TEXT NOT NULL,              -- Extracted dominant color (e.g., "#f0a013")
  skin_variations JSONB,                   -- Skin tone variants if available
  
  -- File references
  filename TEXT NOT NULL,                  -- Image filename (e.g., "1f600.png")
  has_img_apple BOOLEAN DEFAULT true,      -- Apple image availability
  has_img_google BOOLEAN DEFAULT true,     -- Google image availability
  has_img_twitter BOOLEAN DEFAULT true,    -- Twitter image availability
  has_img_facebook BOOLEAN DEFAULT true,   -- Facebook image availability
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🖼️ Image Management

### Current Status (2024)
- ✅ **1,605 valid images** at 160x160px resolution
- ❌ **326 missing images** (mostly newer emojis)
- 🚫 **1 empty image** (placeholder file)
- 🆕 **7 out of 8 missing Unicode 16.0 emojis**

### Image Sources
1. **Primary**: Apple emoji images at 160x160px (`images/apple-160/`)
2. **Naming**: Lowercase hexcode format (e.g., `1f600.png`)
3. **Format**: PNG with transparency support
4. **Quality**: High-resolution for NFT generation

### Missing Unicode 16.0 Emojis (2024)
The following 7 emojis need manual download from [Emojipedia](https://emojipedia.org/apple/):

| Emoji | Name | Hexcode | Download Link |
|-------|------|---------|---------------|
| 🫩 | Face with bags under eyes | 1FAE9 | [emojipedia.org/face-with-bags-under-eyes/](https://emojipedia.org/face-with-bags-under-eyes/) |
| 🫆 | Fingerprint | 1FAC6 | [emojipedia.org/fingerprint/](https://emojipedia.org/fingerprint/) |
| 🪾 | Leafless tree | 1FABE | [emojipedia.org/leafless-tree/](https://emojipedia.org/leafless-tree/) |
| 🫜 | Root vegetable | 1FADC | [emojipedia.org/root-vegetable/](https://emojipedia.org/root-vegetable/) |
| 🪉 | Harp | 1FA89 | [emojipedia.org/harp/](https://emojipedia.org/harp/) |
| 🪏 | Shovel | 1FA8F | [emojipedia.org/shovel/](https://emojipedia.org/shovel/) |
| 🇨🇶 | Flag: Sark | 1F1E8-1F1F6 | [emojipedia.org/flag-sark/](https://emojipedia.org/flag-sark/) |

*Note: 🫟 Splatter (1FADF) exists but is 0 bytes and needs replacement*

## 🎨 Color Extraction

The system uses **node-vibrant** to extract dominant accent colors from emoji images:

```typescript
// Colors are extracted automatically and stored as hex values
// Examples from our data:
"😀" → "#f0a013" (warm orange-yellow)
"😃" → "#f5a311" (bright yellow)
"😄" → "#f5a815" (golden yellow)
```

### Color Selection Priority
1. **Vibrant colors** (most saturated)
2. **Dominant colors** (most prominent)
3. **Fallback colors** (muted alternatives)
4. **Default**: `#888888` if extraction fails

## 🔍 Search System

### Comprehensive Keywords
Each emoji includes multiple search vectors:

1. **Primary name** words (e.g., "grinning", "face")
2. **Shortcodes** (e.g., `:grinning:`, `:smile:`)
3. **Category keywords** (e.g., "smileys", "emotion")
4. **Emoticon mappings** (e.g., `:)` → "smile", "happy")
5. **Tags and aliases** from emoji-data sources

### Search Examples
```sql
-- Find all smile-related emojis
SELECT * FROM emojis WHERE 'smile' = ANY(keywords);

-- Find by category
SELECT * FROM emojis WHERE category = 'Food & Drink';

-- Full-text search across names and keywords
SELECT * FROM emojis WHERE 
  name ILIKE '%heart%' OR 
  'heart' = ANY(keywords);
```

## 🤖 Skin Tone Handling

The system properly handles skin tone variations:

- **Base emojis** are stored as primary records
- **Skin variations** are stored as JSON in `skin_variations`
- **UX behavior**: Dark skin tone input → returns yellow default
- **Search behavior**: All variations map to base emoji

Example skin variation data:
```json
[
  {"emoji": "👋🏻", "hexcode": "1F44B-1F3FB", "tone": 1},
  {"emoji": "👋🏼", "hexcode": "1F44B-1F3FC", "tone": 2},
  {"emoji": "👋🏽", "hexcode": "1F44B-1F3FD", "tone": 3},
  {"emoji": "👋🏾", "hexcode": "1F44B-1F3FE", "tone": 4},
  {"emoji": "👋🏿", "hexcode": "1F44B-1F3FF", "tone": 5}
]
```

## 🛠️ Scripts and Tools

### `analyze-and-populate-emoji-database.ts`
Comprehensive analysis and processing script:

```bash
cd packages/emoji-assets
yarn tsx scripts/analyze-and-populate-emoji-database.ts
```

**Features:**
- ✅ Processes 1,932 emojis from Unicode 16.0
- 🎨 Extracts accent colors using node-vibrant
- 📊 Identifies missing/empty images
- 🔍 Generates comprehensive search keywords
- 💾 Outputs SQL for database population
- 📈 Provides detailed statistics and next steps

**Output:**
- Image analysis and missing file identification
- Color extraction for NFT generation
- SQL INSERT statements for database
- Direct links to download missing emojis

### Example Usage

```typescript
import { analyzeAndPopulateEmojiDatabase } from './scripts/analyze-and-populate-emoji-database'

const results = await analyzeAndPopulateEmojiDatabase()
console.log(`Processed ${results.stats.total} emojis`)
console.log(`${results.stats.withImages} have valid images`)
console.log(`${results.stats.unicode16Missing} Unicode 16.0 emojis missing`)
```

## 🖼️ NFT Generation Pipeline

### Image Requirements for NFTs
- **Resolution**: 160x160px minimum (current), scalable to higher res
- **Format**: PNG with transparency
- **Quality**: Apple emoji design (consistent style)
- **Metadata**: Rich metadata for token attributes

### NFT Metadata Structure
```json
{
  "name": "emoji.today Winner - 2024-12-28",
  "description": "The winning emoji for December 28, 2024",
  "image": "https://assets.emoji.today/nft/1f600-2024-12-28.png",
  "attributes": [
    {"trait_type": "Emoji", "value": "😀"},
    {"trait_type": "Unicode Name", "value": "GRINNING FACE"},
    {"trait_type": "Category", "value": "Smileys & Emotion"},
    {"trait_type": "Date", "value": "2024-12-28"},
    {"trait_type": "Accent Color", "value": "#f0a013"},
    {"trait_type": "Unicode Version", "value": "6.1"},
    {"trait_type": "Vote Count", "value": "1,247"}
  ]
}
```

## 📊 Categories and Statistics

### Emoji Categories (10 total)
1. **Smileys & Emotion** - Faces, hearts, emotions
2. **People & Body** - People, body parts, activities  
3. **Animals & Nature** - Animals, plants, weather
4. **Food & Drink** - Food, beverages, dining
5. **Travel & Places** - Transportation, buildings, maps
6. **Activities** - Sports, entertainment, games
7. **Objects** - Tools, technology, items
8. **Symbols** - Mathematical, religious, other symbols
9. **Flags** - Country and regional flags
10. **Component** - Skin tones, hair styles (filtered out)

### Version Distribution
- **Unicode 6.1-15.1**: 1,924 emojis
- **Unicode 16.0 (2024)**: 8 new emojis
- **Total processed**: 1,932 emojis

## 🚀 Getting Started

### Installation
```bash
cd packages/emoji-assets
yarn install
```

### Download Missing Images
1. Visit the URLs provided by the analysis script
2. Save images as PNG files with lowercase hexcode names
3. Place in `images/apple-160/` directory
4. Re-run analysis to extract colors

### Populate Database
```bash
# Run analysis and get SQL output
yarn tsx scripts/analyze-and-populate-emoji-database.ts > emoji-insert.sql

# Apply to Supabase (via MCP or direct connection)
# SQL statements are ready to copy/paste
```

### Random Emoji Function
```typescript
// Example utility function for getting random emojis
async function getRandomEmoji(category?: string) {
  const query = category 
    ? 'SELECT * FROM emojis WHERE category = $1 ORDER BY RANDOM() LIMIT 1'
    : 'SELECT * FROM emojis ORDER BY RANDOM() LIMIT 1'
  
  const result = await supabase
    .rpc('get_random_emoji', { emoji_category: category })
  
  return result.data[0]
}
```

## 🔗 Unicode Transmission

**Network Safety**: Emojis are transmitted as Unicode characters and are safe across:
- ✅ HTTP/HTTPS requests
- ✅ JSON APIs
- ✅ Database storage (UTF-8)
- ✅ React/JavaScript
- ✅ Modern browsers

**Best Practices**:
- Always use UTF-8 encoding
- Store both emoji character and hexcode for reliability
- Use hexcode for file naming and lookups
- Fallback to hexcode display if emoji fails to render

## 📝 Next Steps

1. **Download missing images** (7 Unicode 16.0 emojis)
2. **Populate Supabase database** with processed data
3. **Build emoji search API** with keyword matching
4. **Implement NFT generation** with metadata
5. **Create random emoji utilities** for daily selection
6. **Set up automated updates** for future Unicode releases

---

*Last updated: December 2024 | Unicode version: 16.0 | Total emojis: 1,932* 