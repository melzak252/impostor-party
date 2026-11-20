import type { CSSProperties } from "react";
import { COLOR_PALETTE, type ColorId } from "../shared/protocol";

export type PlayerFaceMood = "default" | "sus" | "happy";
export type PlayerFaceSize = "sm" | "md" | "lg";

export interface PlayerFaceProps {
  colorId: ColorId;
  isHost?: boolean;
  offline?: boolean;
  mood?: PlayerFaceMood;
  size?: PlayerFaceSize;
  className?: string;
}

const SIZE_STYLES: Record<PlayerFaceSize, CSSProperties> = {
  sm: { width: 32, height: 32, flexBasis: 32, borderRadius: 10 },
  md: { width: 46, height: 46, flexBasis: 46, borderRadius: 15 },
  lg: { width: 54, height: 54, flexBasis: 54, borderRadius: 17 },
};

const INK = "#141824";
const BLUSH = "rgba(255, 107, 139, 0.45)";
const TONGUE = "#ff6b8b";

function FaceSvg({ colorId, mood }: { colorId: ColorId; mood: PlayerFaceMood }) {
  if (mood === "sus") {
    return (
      <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        {/* Sweat drop */}
        <path d="M54 11 C54 11 59 17 59 20.5 A5 5 0 1 1 49 20.5 C49 17 54 11 54 11 Z" fill="#7dd3fc" stroke={INK} strokeWidth="2.4" />
        {/* Narrowed suspicious eyes looking sideways */}
        <path d="M11 22 L27 25" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M35 25 L49 22" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
        <g className="player-face-eyes">
          <rect x="12" y="25" width="14" height="8" rx="4" fill="#fff" stroke={INK} strokeWidth="2.8" />
          <rect x="35" y="25" width="14" height="8" rx="4" fill="#fff" stroke={INK} strokeWidth="2.8" />
          <circle cx="22" cy="29" r="2.8" fill={INK} />
          <circle cx="45" cy="29" r="2.8" fill={INK} />
          <circle cx="23" cy="27.8" r="1" fill="#fff" />
          <circle cx="46" cy="27.8" r="1" fill="#fff" />
        </g>
        {/* Wavy sus mouth */}
        <path d="M20 47 Q26 43 31 47 T43 46" fill="none" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (mood === "happy") {
    return (
      <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="13" cy="36" rx="5.5" ry="3.2" fill={BLUSH} />
        <ellipse cx="51" cy="36" rx="5.5" ry="3.2" fill={BLUSH} />
        <path d="M13 26 Q20 16 27 26" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M37 26 Q44 16 51 26" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
        {/* Big open laugh with tongue */}
        <path d="M18 37 Q32 56 46 37 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M24 45 Q32 41 40 45 Q32 52 24 45 Z" fill={TONGUE} />
        <path d="M20 38.5 L44 38.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  switch (colorId) {
    case "coral":
      return (
        <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          <ellipse cx="13" cy="37" rx="5" ry="3" fill={BLUSH} />
          <ellipse cx="51" cy="37" rx="5" ry="3" fill={BLUSH} />
          {/* Cheeky wink + sparkling eye */}
          <path d="M13 27 Q20 21 27 26" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
          <g className="player-face-eyes">
            <ellipse cx="44" cy="25" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="43" cy="25.5" r="3.8" fill={INK} />
            <circle cx="44.8" cy="23.4" r="1.5" fill="#fff" />
          </g>
          {/* Tongue-out grin */}
          <path d="M19 42 Q32 50 45 40" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M33 45 C33 53 41 53 41 43 Z" fill={TONGUE} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      );
    case "amber":
      return (
        <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          <ellipse cx="12" cy="35" rx="5.5" ry="3.2" fill={BLUSH} />
          <ellipse cx="52" cy="35" rx="5.5" ry="3.2" fill={BLUSH} />
          <g className="player-face-eyes">
            <ellipse cx="21" cy="24" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="3" />
            <ellipse cx="43" cy="24" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="22" cy="24.5" r="3.8" fill={INK} />
            <circle cx="42" cy="24.5" r="3.8" fill={INK} />
            <circle cx="23.5" cy="22.4" r="1.5" fill="#fff" />
            <circle cx="43.5" cy="22.4" r="1.5" fill="#fff" />
          </g>
          {/* Big D-laugh with tongue */}
          <path d="M19 38 Q32 55 45 38 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M25 45 Q32 42 39 45 Q32 51 25 45 Z" fill={TONGUE} />
          <path d="M21 39.5 L43 39.5" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );
    case "mint":
      return (
        <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          {/* Cool meme sunglasses + smirk */}
          <path d="M9 22 L55 22" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="11" y="19" width="19" height="13" rx="4" fill={INK} />
          <rect x="34" y="19" width="19" height="13" rx="4" fill={INK} />
          <path d="M14 23 L19 28" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          <path d="M37 23 L42 28" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          <path d="M22 44 Q33 48 44 42" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "cyan":
      return (
        <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          <ellipse cx="12" cy="36" rx="5" ry="3" fill={BLUSH} />
          <ellipse cx="52" cy="36" rx="5" ry="3" fill={BLUSH} />
          {/* Raised brows + wide shook eyes */}
          <path d="M14 14 Q21 10 27 14" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M37 14 Q43 10 50 14" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <g className="player-face-eyes">
            <ellipse cx="21" cy="25" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="3" />
            <ellipse cx="43" cy="25" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="21" cy="25.5" r="3" fill={INK} />
            <circle cx="43" cy="25.5" r="3" fill={INK} />
            <circle cx="22.3" cy="23.8" r="1.2" fill="#fff" />
            <circle cx="44.3" cy="23.8" r="1.2" fill="#fff" />
          </g>
          <ellipse cx="32" cy="46" rx="6" ry="7" fill={INK} />
          <ellipse cx="32" cy="49" rx="3.2" ry="2.2" fill={TONGUE} />
        </svg>
      );
    case "blue":
      return (
        <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          {/* Sly raised brow + side-eye glance */}
          <path d="M13 15 Q20 11 27 16" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M37 18 L51 15" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <g className="player-face-eyes">
            <ellipse cx="20" cy="26" rx="7.5" ry="8.5" fill="#fff" stroke={INK} strokeWidth="3" />
            <ellipse cx="44" cy="26" rx="7.5" ry="8.5" fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="23" cy="26" r="3.6" fill={INK} />
            <circle cx="47" cy="26" r="3.6" fill={INK} />
            <circle cx="24.2" cy="24.2" r="1.4" fill="#fff" />
            <circle cx="48.2" cy="24.2" r="1.4" fill="#fff" />
          </g>
          <path d="M20 43 Q32 49 44 41" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "violet":
      return (
        <svg className="player-face-svg" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          <ellipse cx="12" cy="38" rx="5" ry="3" fill={BLUSH} />
          <ellipse cx="52" cy="36" rx="5" ry="3" fill={BLUSH} />
          {/* Chaotic goofy asymmetric eyes + wavy grin */}
          <g className="player-face-eyes">
            <ellipse cx="20" cy="27" rx="7" ry="8" fill="#fff" stroke={INK} strokeWidth="3" />
            <ellipse cx="44" cy="21" rx="8.2" ry="9.8" fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="21.5" cy="27" r="3.4" fill={INK} />
            <circle cx="42" cy="21.5" r="3.8" fill={INK} />
            <circle cx="22.8" cy="25.2" r="1.3" fill="#fff" />
            <circle cx="43.5" cy="19.5" r="1.5" fill="#fff" />
          </g>
          <path d="M19 42 Q26 49 32 43 Q38 49 45 42" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}

export function PlayerFace({
  colorId,
  isHost = false,
  offline = false,
  mood = "default",
  size = "md",
  className,
}: PlayerFaceProps) {
  const swatch = COLOR_PALETTE.find((color) => color.id === colorId)?.swatch ?? "#898d97";
  const classes = [
    "player-face",
    `player-face-${colorId}`,
    `player-face-${size}`,
    isHost ? "player-face-host" : "",
    offline ? "player-face-offline" : "",
    mood === "sus" ? "player-face-sus" : "",
    mood === "happy" ? "player-face-happy" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    "--player-color": swatch,
    ...SIZE_STYLES[size],
  } as CSSProperties;

  return (
    <span className={classes} style={style} aria-hidden="true">
      <FaceSvg colorId={colorId} mood={mood} />
    </span>
  );
}
