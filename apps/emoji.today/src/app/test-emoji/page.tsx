"use client";

import { useState } from 'react';
import { EMOJI_FILENAME_MAP } from "@emoji.today/emoji-assets/src/filename-mapping";

export default function TestEmojiPage() {
  const [searchParam, setSearchParam] = useState('');

  const testEmojis = ['❇️', '❇', '🥶', '💯'];

  const handleTest = (emoji: string) => {
    const encoded = encodeURIComponent(emoji);
    const decoded = decodeURIComponent(encoded);
    const filename = EMOJI_FILENAME_MAP[emoji];
    const filenameDecoded = EMOJI_FILENAME_MAP[decoded];

    console.log('Test Results:', {
      original: emoji,
      encoded,
      decoded,
      filename,
      filenameDecoded,
      charCodes: Array.from(emoji).map(c => c.charCodeAt(0).toString(16)),
      decodedCharCodes: Array.from(decoded).map(c => c.charCodeAt(0).toString(16)),
    });

    // Try to fetch from the API
    fetch(`/api/participation?emoji=${encoded}`)
      .then(res => res.headers.get('content-type'))
      .then(contentType => console.log('API Response content-type:', contentType))
      .catch(err => console.error('API Error:', err));
  };

  const handleSearchParamTest = () => {
    const decoded = decodeURIComponent(searchParam);
    const filename = EMOJI_FILENAME_MAP[decoded];
    console.log('Search Param Test:', {
      searchParam,
      decoded,
      filename,
      charCodes: Array.from(decoded).map(c => c.charCodeAt(0).toString(16)),
    });
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen font-mono">
      <h1 className="text-2xl mb-8">Emoji Encoding Debug</h1>

      <div className="space-y-6">
        <div className="border border-white/20 p-4 rounded">
          <h2 className="text-lg mb-4">Test Common Emojis</h2>
          <div className="space-y-2">
            {testEmojis.map(emoji => (
              <div key={emoji} className="flex items-center gap-4">
                <span className="text-2xl w-12">{emoji}</span>
                <button
                  onClick={() => handleTest(emoji)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded"
                >
                  Test
                </button>
                <span className="text-xs text-white/50">
                  {EMOJI_FILENAME_MAP[emoji] || 'NO MAPPING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/20 p-4 rounded">
          <h2 className="text-lg mb-4">Test URL Search Param</h2>
          <input
            type="text"
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            placeholder="Paste encoded emoji from URL"
            className="w-full px-3 py-2 bg-white/10 rounded mb-2"
          />
          <button
            onClick={handleSearchParamTest}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded"
          >
            Test Search Param
          </button>
        </div>

        <div className="border border-white/20 p-4 rounded">
          <h2 className="text-lg mb-4">Direct Image Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            {testEmojis.map(emoji => {
              const filename = EMOJI_FILENAME_MAP[emoji];
              const url = filename ? `/emoji-assets/apple-160/${filename}` : null;
              return (
                <div key={emoji} className="border border-white/10 p-2 rounded">
                  <div className="text-xs mb-1">{emoji} → {filename}</div>
                  {url && (
                    <img
                      src={url}
                      alt={emoji}
                      className="w-16 h-16"
                      onError={(e) => console.error(`Failed to load: ${url}`)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 