'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Eye, Zap } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Trust Score v2',
    description:
      'Four-pillar scoring system: Infrastructure (50%), Community (20%), Correlation (15%), and Reinforcement Learning (15%). Combines on-chain data, TRACER analysis, and Sentinel validation.',
  },
  {
    icon: Eye,
    title: 'Super Sentinel',
    description:
      '27-check automated validation engine covering metadata integrity, infrastructure health, TLS, A2A/MCP endpoints, x402 payment flows, and latency benchmarks.',
  },
  {
    icon: Zap,
    title: 'TRACER Score',
    description:
      'Six-dimension agent intelligence: Trust, Reliability, Autonomy, Capability, Economics, and Reputation. Real-time cross-validation with Sentinel data.',
  },
];

export function FeaturesSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    const cards = cardsRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === header && entry.isIntersecting) {
            setHeaderVisible(true);
          }
          if (entry.target === cards && entry.isIntersecting) {
            setCardsVisible(true);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    if (header) observer.observe(header);
    if (cards) observer.observe(cards);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
      <div
        ref={headerRef}
        className={`mb-16 text-center ${headerVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
          Why Enigma?
        </h2>
        <p className="mx-auto max-w-2xl text-text-secondary">
          A comprehensive platform for evaluating and monitoring autonomous agents on Avalanche.
        </p>
      </div>

      <div ref={cardsRef} className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className={`glass group p-8 interactive-card gradient-border ${cardsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: cardsVisible ? `${index * 150}ms` : '0ms' }}
          >
            <div className="mb-4 inline-flex rounded-lg bg-[rgba(59,130,246,0.1)] p-3 transition-all group-hover:bg-[rgba(59,130,246,0.2)] group-hover:scale-110">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
