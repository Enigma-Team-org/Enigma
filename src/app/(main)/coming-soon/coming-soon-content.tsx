'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURE_INFO: Record<string, { title: string; description: string }> = {
  analytics: {
    title: 'Analytics Dashboard',
    description: 'Advanced analytics and insights for your agents, including performance metrics, trend analysis, and predictive indicators.',
  },
  settings: {
    title: 'Settings',
    description: 'Customize your Enigma experience with personalized preferences, notification controls, and account management.',
  },
  default: {
    title: 'New Feature',
    description: 'We\'re working on something exciting. Stay tuned for updates!',
  },
};

export function ComingSoonContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') ?? 'default';
  const info = FEATURE_INFO[feature] ?? FEATURE_INFO.default;

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(167,139,250,0.1)] ring-1 ring-[rgba(167,139,250,0.2)]">
              <Clock className="h-10 w-10 text-[#A78BFA]" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#4ADE80]">
              <Sparkles className="h-3 w-3 text-[#0B0F14]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold text-white">
          {info.title}
        </h1>

        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[rgba(167,139,250,0.1)] px-3 py-1 text-xs font-semibold text-[#A78BFA]">
          <Clock className="h-3 w-3" />
          Coming Soon
        </div>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-md text-[rgba(255,255,255,0.6)]">
          {info.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/scanner">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scanner
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs">
              View Documentation
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-[rgba(255,255,255,0.4)]">
          Want to be notified when this feature launches?{' '}
          <a
            href="https://t.me/enigma_avax"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A78BFA] hover:underline"
          >
            Join our Telegram
          </a>
        </p>
      </div>
    </div>
  );
}
