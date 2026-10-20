import { highlightParts } from '../lib/secondBrain.mjs';

export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.hit ? (
          <mark key={i} className="rounded-[2px] bg-teal/25 px-px text-paper">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
