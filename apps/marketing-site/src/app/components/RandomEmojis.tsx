import Emoji from '@/components/Emoji';
import { getRandomEmojis } from '@/lib/emojis';

// const getEmojiRanges = cache(async (): Promise<EmojiRange[]> => {
//   try {
//     const response = await fetch('/emoji-sequences.txt');
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const content = await response.text();
//     const lines = content.split("\n");

//     return lines
//       .filter((line) => line.includes("Basic_Emoji"))
//       .map((line) => {
//         const [range, , description] = line.split(";").map((part) => part.trim());
//         const [start, end] = range.split("..").map((code) => parseInt(code, 16));
//         return { start, end: end || start, description };
//       });
//   } catch (error) {
//     console.error("Failed to fetch emoji sequences:", error);
//     return []; // Return an empty array or some default ranges
//   }
// });

// function getRandomEmoji(emojiRanges: EmojiRange[]): string {
//   if (emojiRanges.length === 0) {
//     return '😊'; // Return a default emoji if no ranges are available
//   }
//   const range = emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
//   const codePoint =
//     Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
//   return String.fromCodePoint(codePoint);
// }

// async function getRandomEmojis(count: number = 100): Promise<string[]> {
//   const emojiRanges = await getEmojiRanges();
//   const emojis = new Set<string>();
//   while (emojis.size < count) {
//     emojis.add(getRandomEmoji(emojiRanges));
//   }
//   return Array.from(emojis);
// }

export default function RandomEmojis({ count = 100 }: { count?: number }) {
  const emojis = getRandomEmojis(count);

  return (

    <div className="flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-10 px-5 md:px-10 mt-20">
        {emojis.map((emoji, index) => (
          <>
            <div className="block md:hidden">
              <Emoji key={index} emoji={emoji} size={125} />
            </div>
            <div className="hidden md:block">
              <Emoji key={index} emoji={emoji} size={165} />
            </div>
          </>
        ))}
      </div>
    </div>
  );
}