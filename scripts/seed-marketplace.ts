/**
 * Seed script: Create marketplace services for known agents.
 *
 * Inserts AgentService records for Apex Arbitrage and AvaBuilder agents
 * using their existing DB addresses.
 *
 * Run: npx tsx scripts/seed-marketplace.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  // ── Apex Arbitrage Agent (#1687) ──
  {
    agentAddress: '0xfc6f71502d24f04e0463452947cc152a0eb4de3c',
    name: 'Triangular Arbitrage Scanner',
    description:
      'Real-time triangular arbitrage detection across Avalanche DEXs (Trader Joe, Pangolin, GMX). Identifies profitable routes and estimates net profit after gas.',
    category: 'TRADING' as const,
    priceUsd: '0.05',
    endpoint: 'https://apex-arbitrage-agent-production.up.railway.app/api/signals',
  },
  {
    agentAddress: '0xfc6f71502d24f04e0463452947cc152a0eb4de3c',
    name: 'Cross-DEX Price Monitor',
    description:
      'Continuous price monitoring across multiple Avalanche DEXs. Alerts on significant price deviations and liquidity imbalances between pools.',
    category: 'TRADING' as const,
    priceUsd: '0.02',
    endpoint: 'https://apex-arbitrage-agent-production.up.railway.app/api/mcp',
  },
  {
    agentAddress: '0xfc6f71502d24f04e0463452947cc152a0eb4de3c',
    name: 'DeFi Yield Optimizer',
    description:
      'Analyzes yield farming opportunities on Avalanche. Compares APY across lending protocols (Aave, Benqi) and LP pools with risk-adjusted returns.',
    category: 'DEFI' as const,
    priceUsd: '0.03',
    endpoint: 'https://apex-arbitrage-agent-production.up.railway.app/api/mcp',
  },

  // ── AvaBuilder Agent (#1686) ──
  {
    agentAddress: '0x9b59db8e7534924e34baa67a86454125cb02206d',
    name: 'DeFi Risk Analysis Report',
    description:
      'Comprehensive risk assessment for DeFi protocols on Avalanche. Evaluates smart contract risk, liquidity depth, protocol TVL trends, and audit status.',
    category: 'ANALYTICS' as const,
    priceUsd: '0.01',
    endpoint: 'https://avariskscan-defi-production.up.railway.app/a2a/guide',
  },
  {
    agentAddress: '0x9b59db8e7534924e34baa67a86454125cb02206d',
    name: 'Smart Contract Security Scan',
    description:
      'Automated security analysis of smart contracts on Avalanche C-Chain. Detects common vulnerabilities, proxy patterns, and known exploit signatures.',
    category: 'SECURITY' as const,
    priceUsd: '0.05',
    endpoint: 'https://avariskscan-defi-production.up.railway.app/api/mcp',
  },
  {
    agentAddress: '0x9b59db8e7534924e34baa67a86454125cb02206d',
    name: 'Protocol Health Monitor',
    description:
      'Real-time health monitoring for DeFi protocols. Tracks TVL changes, whale movements, governance proposals, and anomalous on-chain activity.',
    category: 'ANALYTICS' as const,
    priceUsd: '0.02',
    endpoint: 'https://avariskscan-defi-production.up.railway.app/api/mcp',
  },
  {
    agentAddress: '0x9b59db8e7534924e34baa67a86454125cb02206d',
    name: 'Avalanche Infrastructure Audit',
    description:
      'Evaluates agent infrastructure compliance: ERC-8004 registration, A2A compatibility, MCP tools, x402 payment endpoints, and Sentinel validation status.',
    category: 'INFRASTRUCTURE' as const,
    priceUsd: '0.03',
    endpoint: 'https://avariskscan-defi-production.up.railway.app/api/mcp',
  },
];

async function main() {
  console.log('=== Marketplace Seeder ===\n');

  // Verify agents exist in DB
  const addresses = [...new Set(SERVICES.map((s) => s.agentAddress))];
  for (const addr of addresses) {
    const agent = await prisma.agent.findUnique({
      where: { address: addr },
      select: { address: true, name: true },
    });
    if (!agent) {
      console.error(`Agent ${addr} not found in DB. Run seed-agents.ts first.`);
      process.exit(1);
    }
    console.log(`  ✓ Agent found: ${agent.name} (${addr.slice(0, 10)}...)`);
  }

  // Insert services (skip duplicates by name+agent)
  let created = 0;
  let skipped = 0;

  for (const svc of SERVICES) {
    const existing = await prisma.agentService.findFirst({
      where: {
        agentAddress: svc.agentAddress,
        name: svc.name,
      },
    });

    if (existing) {
      console.log(`  ⏭ Skipped (exists): ${svc.name}`);
      skipped++;
      continue;
    }

    await prisma.agentService.create({
      data: {
        agentAddress: svc.agentAddress,
        name: svc.name,
        description: svc.description,
        category: svc.category,
        priceUsd: svc.priceUsd,
        endpoint: svc.endpoint,
        isActive: true,
      },
    });

    console.log(`  ✓ Created: ${svc.name} (${svc.category}) — $${svc.priceUsd}`);
    created++;
  }

  console.log(`\n=== Done: ${created} created, ${skipped} skipped ===`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
