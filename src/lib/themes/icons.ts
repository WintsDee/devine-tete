import {
  Award,
  Bike,
  Brush,
  Camera,
  Car,
  Clapperboard,
  Crown,
  Drama,
  Dumbbell,
  Flame,
  Gamepad2,
  Ghost,
  Globe2,
  Guitar,
  Heart,
  IceCream,
  Landmark,
  Laugh,
  Medal,
  Mic2,
  Music4,
  Palette,
  PartyPopper,
  Pizza,
  Popcorn,
  Rocket,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Swords,
  Tv,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: LucideIcon[] = [
  Star,
  Mic2,
  Clapperboard,
  Gamepad2,
  Medal,
  Music4,
  Popcorn,
  Crown,
  Rocket,
  Pizza,
  Tv,
  Guitar,
  Sparkles,
  Swords,
  Ghost,
  Palette,
  Dumbbell,
  Smartphone,
  Car,
  Heart,
  PartyPopper,
  Laugh,
  Camera,
  Landmark,
  Globe2,
  IceCream,
  Brush,
  Bike,
  Flame,
  Award,
  Drama,
  ShoppingBag,
  Wand2,
  Zap,
];

/** Palette classes matching the app tokens: yellow first, then the multicolor rotation. */
export const THEME_COLORS = [
  "text-word",
  "text-accent",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
  "text-primary",
] as const;

function hash(value: string) {
  let total = 0;
  for (let i = 0; i < value.length; i += 1) total = (total * 31 + value.charCodeAt(i)) % 100000;
  return total;
}

/** Stable Lucide icon for a theme id, so the grid stays in the app style (no emoji). */
export function themeIcon(id: string): LucideIcon {
  return ICONS[hash(id) % ICONS.length]!;
}

/** Stable color class for a theme id. */
export function themeColor(id: string): string {
  return THEME_COLORS[hash(`${id}-color`) % THEME_COLORS.length]!;
}