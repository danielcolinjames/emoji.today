import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getEmojiFilenameNormalized } from "@emoji.today/emoji-assets/src/emoji-utils";
import { EMOJI_FILENAME_MAP } from "@emoji.today/emoji-assets/src/filename-mapping";
import { supabase } from "@/lib/supabase";
import { getCurrentVotingDateString } from '@/lib/date-utils';

export const runtime = "edge";

async function loadGoogleFont(fontFamily: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400&text=${encodeURIComponent(text)}`;

  const css = await fetch(url).then((res) => res.text());

  const fontURL = css.match(/url\(([^)]+)\)/)?.[1];

  if (!fontURL) {
    throw new Error(`Failed to extract font URL from Google Fonts CSS for family: ${fontFamily}`);
  }

  return fetch(fontURL).then((res) => res.arrayBuffer());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const emoji = searchParams.get('emoji') || '🗳️';
    const date = searchParams.get('date');
    const accentColor = searchParams.get('accentColor') || '#FFFFFF';

    // Use provided date or current voting date
    const displayDate = date || getCurrentVotingDateString();

    // Use normalized emoji lookup to handle variation selectors
    const emojiFilename = getEmojiFilenameNormalized(emoji);

    // Use localhost for development, dynamic origin for production
    const requestUrl = new URL(request.url);
    const origin = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_URL || requestUrl.origin);
    const emojiImageUrl = emojiFilename
      ? `${origin}/emoji-assets/apple-160/${emojiFilename}`
      : null;

    // Use white accent color as fallback when no emoji image
    const displayAccentColor = emojiImageUrl && accentColor
      ? decodeURIComponent(accentColor)
      : "#FFFFFF";

    // Format date components separately for vertical layout
    const dateObj = new Date(displayDate);
    const month = dateObj.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
    const year = dateObj.toLocaleDateString('en-US', { year: 'numeric' });

    // Load fonts
    const satoshiBoldFontData = await fetch(
      new URL("../../../assets/fonts/Satoshi-Bold.otf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const satoshiRegularFontData = await fetch(
      new URL("../../../assets/fonts/Satoshi-Regular.otf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const satoshiLightFontData = await fetch(
      new URL("../../../assets/fonts/Satoshi-Light.otf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    // Load Geist Mono from Google Fonts
    const dateText = `${month}${day}${year}`;
    const geistMonoFontData = await loadGoogleFont('Geist+Mono', dateText);

    // Create colored badge SVG
    const coloredBadgeSvg = `<svg width="144" height="144" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M144 72C143.862 67.0498 142.352 62.2299 139.632 58.0843C136.92 53.9464 133.103 50.636 128.613 48.5364C130.322 43.8851 130.682 38.8506 129.686 34C128.682 29.1418 126.337 24.6667 122.927 21.0728C119.326 17.6628 114.858 15.3257 110 14.3142C105.149 13.318 100.115 13.6782 95.4636 15.387C93.3716 10.8889 90.069 7.06515 85.9234 4.35251C81.7778 1.63987 76.9579 0.122605 72 0C67.0498 0.130268 62.2452 1.6322 58.1073 4.35251C53.9694 7.07282 50.682 10.8965 48.6054 15.387C43.9464 13.6782 38.8966 13.3027 34.0307 14.3142C29.1648 15.3104 24.682 17.6552 21.0805 21.0728C17.6705 24.6743 15.341 29.1571 14.3525 34.0077C13.3563 38.8582 13.7395 43.8927 15.4559 48.5364C10.9579 50.636 7.12644 53.9387 4.39847 58.0766C1.6705 62.2146 0.145594 67.0421 0 72C0.153257 76.9579 1.6705 81.7778 4.39847 85.9234C7.12644 90.0613 10.9579 93.3716 15.4559 95.4636C13.7395 100.107 13.3563 105.142 14.3525 109.992C15.3487 114.851 17.6705 119.326 21.0728 122.927C24.6743 126.322 29.1494 128.651 34 129.655C38.8506 130.667 43.8851 130.299 48.5364 128.613C50.636 133.103 53.9387 136.92 58.0843 139.64C62.2222 142.352 67.0498 143.862 72 144C76.9579 143.877 81.7778 142.368 85.9234 139.655C90.069 136.943 93.3716 133.111 95.4636 128.621C100.092 130.452 105.165 130.889 110.046 129.877C114.92 128.866 119.395 126.452 122.92 122.927C126.444 119.402 128.866 114.927 129.877 110.046C130.889 105.165 130.452 100.092 128.613 95.4636C133.103 93.364 136.92 90.0613 139.64 85.9157C142.352 81.7778 143.862 76.9502 144 72Z" fill="${displayAccentColor}"/>
<path d="M37.44 74.0353L63.7159 100.303L107.264 52.7479L96.9419 43.2L63.2254 79.9357L47.3481 64.0583L37.44 74.0353Z" fill="#050505"/>
</svg>`;

    const badgeDataUrl = `data:image/svg+xml;base64,${Buffer.from(coloredBadgeSvg).toString('base64')}`;

    // Inline smile emoji SVG (from logo-white)
    const smileEmojiSvg = `<svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M250 0C388.071 0 500 111.929 500 250C500 388.071 388.071 500 250 500C111.929 500 0 388.071 0 250C0 111.929 111.929 0 250 0ZM250 30C128.497 30 30 128.497 30 250C30 371.503 128.497 470 250 470C371.503 470 470 371.503 470 250C470 128.497 371.503 30 250 30ZM318 235C326.284 235 333 241.716 333 250C333 295.84 295.84 333 250 333C204.16 333 167 295.84 167 250C167 241.716 173.716 235 182 235C190.284 235 197 241.716 197 250C197 279.271 220.729 303 250 303C279.271 303 303 279.271 303 250C303 241.716 309.716 235 318 235ZM189.5 170C201.926 170 212 180.074 212 192.5C212 204.926 201.926 215 189.5 215C177.074 215 167 204.926 167 192.5C167 180.074 177.074 170 189.5 170ZM310.5 170C322.926 170 333 180.074 333 192.5C333 204.926 322.926 215 310.5 215C298.074 215 288 204.926 288 192.5C288 180.074 298.074 170 310.5 170Z" fill="white"/>
</svg>`;

    const smileEmojiDataUrl = `data:image/svg+xml;base64,${Buffer.from(smileEmojiSvg).toString('base64')}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: '#050505',
            position: 'relative',
            padding: '100px',
          }}
        >
          {/* Top Left: Emoji with Ring */}
          <div
            style={{
              position: 'absolute',
              top: '100px',
              left: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {emojiImageUrl ? (
              <div style={{
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                border: `36px solid ${displayAccentColor}`,
                backgroundColor: '#050505',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img
                  src={emojiImageUrl}
                  alt={emoji}
                  width="300"
                  height="300"
                  style={{
                    width: '300px',
                    height: '300px',
                  }}
                />
              </div>
            ) : (
              <img
                src={smileEmojiDataUrl}
                alt="Emoji Today Logo"
                width="600"
                height="600"
                style={{
                  width: '600px',
                  height: '600px',
                }}
              />
            )}
          </div>

          {/* Bottom Left: Badge + "I voted" text */}
          <div
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '100px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '28px',
            }}
          >
            <img
              src={badgeDataUrl}
              alt="Voted Badge"
              width="96"
              height="96"
              style={{
                width: '96px',
                height: '96px',
              }}
            />
            <div style={{
              color: 'white',
              fontSize: '96px',
              fontFamily: 'Satoshi-Regular',
              display: 'flex',
            }}>
              I voted
            </div>
          </div>

          {/* Top Right: Smile Emoji */}
          <div
            style={{
              position: 'absolute',
              top: '100px',
              right: '100px',
              display: 'flex',
            }}
          >
            <img
              src={smileEmojiDataUrl}
              alt="Smile Emoji"
              width="100"
              height="100"
              style={{
                width: '100px',
                height: '100px',
              }}
            />
          </div>

          {/* Bottom Right: Date */}
          <div
            style={{
              position: 'absolute',
              bottom: '100px',
              right: '100px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              fontFamily: 'Geist Mono',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '80px', color: '#696969', lineHeight: 1, display: 'flex', marginBottom: '-12px' }}>
              {month}
            </div>
            <div style={{ fontSize: '128px', color: '#DADADA', lineHeight: 1, fontWeight: 'bold', display: 'flex' }}>
              {day}
            </div>
            <div style={{ fontSize: '64px', color: '#696969', lineHeight: 1, display: 'flex' }}>
              {year}
            </div>
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 1000,
        fonts: [
          {
            name: "Satoshi-Bold",
            data: satoshiBoldFontData,
            style: "normal",
          },
          {
            name: "Satoshi-Regular",
            data: satoshiRegularFontData,
            style: "normal",
          },
          {
            name: "Satoshi-Light",
            data: satoshiLightFontData,
            style: "normal",
          },
          {
            name: "Geist Mono",
            data: geistMonoFontData,
            style: "normal",
          },
        ],
      },
    );
  } catch (error) {
    console.error('Error in GET function:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 