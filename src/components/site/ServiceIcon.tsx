import {
  Activity,
  BatteryCharging,
  CircleDot,
  Cog,
  Disc3,
  Droplet,
  Hammer,
  Lightbulb,
  MoveVertical,
  SearchCheck,
  Snowflake,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  wrench: Wrench,
  droplet: Droplet,
  activity: Activity,
  disc: Disc3,
  snowflake: Snowflake,
  'circle-dot': CircleDot,
  'battery-charging': BatteryCharging,
  cog: Cog,
  sparkles: Sparkles,
  hammer: Hammer,
  'move-vertical': MoveVertical,
  'search-check': SearchCheck,
  lightbulb: Lightbulb,
  zap: Zap,
};

export function ServiceIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = MAP[name ?? 'wrench'] ?? Wrench;
  return <Icon className={className} />;
}
