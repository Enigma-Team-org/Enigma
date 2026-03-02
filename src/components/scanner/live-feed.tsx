'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  Heart,
  ShieldCheck,
  ShieldX,
  Star,
  XCircle,
  Zap,
} from 'lucide-react';
import { useActivityFeed, type ActivityEvent } from '@/hooks/use-activity-feed';
import { Spinner } from '@/components/shared/spinner';
import { cn } from '@/lib/utils/index';

function getEventConfig(type: string) {
  switch (type) {
    case 'AGENT_REGISTERED':
      return { icon: Bot, color: 'text-[#A78BFA]', bg: 'bg-[rgba(167,139,250,0.1)]', verb: 'Registered' };
    case 'AGENT_VERIFIED':
      return { icon: ShieldCheck, color: 'text-[#4ADE80]', bg: 'bg-[rgba(74,222,128,0.1)]', verb: 'Verified' };
    case 'RATING_RECEIVED':
      return { icon: Heart, color: 'text-[#FB923C]', bg: 'bg-[rgba(251,146,60,0.1)]', verb: 'Rated' };
    case 'SENTINEL_PASS':
      return { icon: ShieldCheck, color: 'text-[#4ADE80]', bg: 'bg-[rgba(74,222,128,0.1)]', verb: 'Sentinel PASS' };
    case 'SENTINEL_FAIL':
      return { icon: ShieldX, color: 'text-[#FB7185]', bg: 'bg-[rgba(251,113,133,0.1)]', verb: 'Sentinel FAIL' };
    case 'HEARTBEAT_FAIL':
      return { icon: XCircle, color: 'text-[#FB7185]', bg: 'bg-[rgba(251,113,133,0.1)]', verb: 'Heartbeat Failed' };
    case 'TRANSACTION':
      return { icon: ArrowRightLeft, color: 'text-[#22D3EE]', bg: 'bg-[rgba(34,211,238,0.1)]', verb: 'Transaction' };
    case 'ENDPOINT_ADDED':
      return { icon: Zap, color: 'text-[#FCD34D]', bg: 'bg-[rgba(252,211,77,0.1)]', verb: 'Endpoint Added' };
    case 'STAR_ADDED':
      return { icon: Star, color: 'text-[#FCD34D]', bg: 'bg-[rgba(252,211,77,0.1)]', verb: 'Starred' };
    default:
      return { icon: Activity, color: 'text-[#64748B]', bg: 'bg-[rgba(255,255,255,0.05)]', verb: type };
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function EventRow({ event }: { event: ActivityEvent }) {
  const config = getEventConfig(event.type);
  const Icon = config.icon;

  return (
    <Link
      href={`/agents/${event.agentAddress}`}
      className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-all hover:bg-[rgba(255,255,255,0.03)]"
    >
      <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md', config.bg)}>
        <Icon className={cn('h-3 w-3', config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium text-white">{event.agentName}</span>
          <span className={cn('shrink-0 text-[10px] font-semibold', config.color)}>{config.verb}</span>
        </div>
        <p className="truncate text-[10px] text-[#475569]">{event.detail}</p>
      </div>
      <span className="mt-0.5 shrink-0 font-data text-[10px] text-[#475569]">{timeAgo(event.timestamp)}</span>
    </Link>
  );
}

interface LiveFeedProps {
  limit?: number;
  maxHeight?: string;
}

export function LiveFeed({ limit = 15, maxHeight = '420px' }: LiveFeedProps) {
  const { data: events, isLoading } = useActivityFeed(limit);

  return (
    <div className="glass flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[rgba(34,211,238,0.1)]">
            <Activity className="h-3 w-3 text-[#22D3EE]" />
          </div>
          <h3 className="text-sm font-semibold text-white">Live Feed</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
          <span className="font-data text-[10px] text-[#475569]">live</span>
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        )}
        {!isLoading && (!events || events.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="mb-2 h-5 w-5 text-[#334155]" />
            <p className="text-xs text-[#475569]">No recent activity</p>
            <p className="text-[10px] text-[#334155]">Events will appear here as agents interact</p>
          </div>
        )}
        {!isLoading && events && events.length > 0 && (
          <div className="divide-y divide-[rgba(255,255,255,0.03)] py-1">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
