import { createLogger } from '@/lib/utils/logger';
import { prisma } from '@/lib/database/prisma';
import { publicClient } from '@/lib/blockchain/client';
import { type Address } from 'viem';

const logger = createLogger('sentinel-validator');

// ============================================
// TYPES
// ============================================

export interface CheckResult {
  check: string;
  points: number;
  maxPoints: number;
  passed: boolean;
  details: string;
  category: 'metadata' | 'infrastructure' | 'aws' | 'x402' | 'bonus';
}

export interface ValidationResult {
  agentAddress: string;
  totalScore: number;
  maxScore: number;
  verdict: 'PASS' | 'PARTIAL' | 'FAIL';
  categories: {
    metadata: number;
    infrastructure: number;
    aws: number;
    x402: number;
    bonus: number;
  };
  checks: CheckResult[];
  criticalFailures: string[];
  duration: number;
}

// ERC-8004 Registry contract on Avalanche C-Chain
const ERC8004_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as Address;

// ABI fragments we need
const REGISTRY_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely fetch a URL with timeout
 */
async function safeFetch(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response | null> {
  const { timeout = 5000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Extract base URL from services array or metadata
 */
function extractBaseUrl(metadata: Record<string, unknown>): string | null {
  // Try services array first — check both 'url' and 'endpoint' fields
  const services = metadata.services as Array<{ url?: string; endpoint?: string; name?: string }> | undefined;
  if (services && Array.isArray(services)) {
    // Prefer 'web' service endpoint as base URL
    const webService = services.find(s => s.name?.toLowerCase() === 'web');
    if (webService) {
      const webUrl = webService.endpoint || webService.url;
      if (webUrl && typeof webUrl === 'string') {
        try {
          const u = new URL(webUrl);
          return `${u.protocol}//${u.host}`;
        } catch { /* skip */ }
      }
    }

    // Fallback: try any service with url or endpoint
    for (const svc of services) {
      const svcUrl = svc.endpoint || svc.url;
      if (svcUrl && typeof svcUrl === 'string') {
        try {
          const u = new URL(svcUrl);
          return `${u.protocol}//${u.host}`;
        } catch { /* skip */ }
      }
    }
  }

  // Try direct url field
  if (metadata.url && typeof metadata.url === 'string') {
    try {
      const u = new URL(metadata.url as string);
      return `${u.protocol}//${u.host}`;
    } catch { /* skip */ }
  }

  return null;
}

/**
 * Check if a service type is declared in metadata
 */
function hasServiceType(metadata: Record<string, unknown>, type: string): boolean {
  const services = metadata.services as Array<{ type?: string }> | undefined;
  if (!services || !Array.isArray(services)) return false;
  return services.some(s => s.type?.toLowerCase().includes(type.toLowerCase()));
}

// ============================================
// METADATA CHECKS (1-6) — 40 points max
// ============================================

/**
 * Check 1: AGENTURL_PARSEABLE (10 points) — CRITICAL
 */
async function checkAgentUrlParseable(
  agent: { token_id: number | null; token_uri: string | null; metadata: unknown }
): Promise<{ result: CheckResult; metadata: Record<string, unknown> | null }> {
  const check: CheckResult = {
    check: 'AGENTURL_PARSEABLE',
    points: 0,
    maxPoints: 10,
    passed: false,
    details: '',
    category: 'metadata',
  };

  // If we have cached metadata from DB, use it
  if (agent.metadata && typeof agent.metadata === 'object') {
    check.points = 10;
    check.passed = true;
    check.details = 'Metadata JSON valid (from registry sync)';
    return { result: check, metadata: agent.metadata as Record<string, unknown> };
  }

  // Try fetching from tokenURI
  if (agent.token_uri) {
    try {
      const res = await safeFetch(agent.token_uri, { timeout: 8000 });
      if (res && res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object') {
          check.points = 10;
          check.passed = true;
          check.details = 'tokenURI reachable, returns valid JSON';
          return { result: check, metadata: json as Record<string, unknown> };
        }
      }
      check.details = `tokenURI returned ${res?.status || 'no response'}`;
    } catch (err) {
      check.details = `tokenURI fetch failed: ${err instanceof Error ? err.message : 'unknown'}`;
    }
  } else if (agent.token_id !== null) {
    // Try reading from contract
    try {
      const uri = await publicClient.readContract({
        address: ERC8004_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [BigInt(agent.token_id)],
      });
      if (uri) {
        const res = await safeFetch(uri, { timeout: 8000 });
        if (res && res.ok) {
          const json = await res.json();
          if (json && typeof json === 'object') {
            check.points = 10;
            check.passed = true;
            check.details = 'On-chain tokenURI resolved to valid JSON';
            return { result: check, metadata: json as Record<string, unknown> };
          }
        }
      }
      check.details = 'On-chain tokenURI unresolvable';
    } catch {
      check.details = 'Could not read tokenURI from registry contract';
    }
  } else {
    check.details = 'No tokenURI or tokenId available';
  }

  return { result: check, metadata: null };
}

/**
 * Check 2: METADATA_COMPLETE (5 points)
 */
function checkMetadataComplete(metadata: Record<string, unknown> | null): CheckResult {
  const check: CheckResult = {
    check: 'METADATA_COMPLETE',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'metadata',
  };

  if (!metadata) {
    check.details = 'No metadata available';
    return check;
  }

  const required = ['name', 'description', 'services', 'active', 'registrations'];
  const present = required.filter(f => metadata[f] !== undefined && metadata[f] !== null);
  const missing = required.filter(f => !present.includes(f));

  if (missing.length === 0) {
    check.points = 5;
    check.passed = true;
    check.details = 'All required fields present';
  } else {
    // Partial credit: 1 point per field present
    check.points = Math.min(present.length, 4);
    check.details = `Missing: ${missing.join(', ')}`;
  }

  return check;
}

/**
 * Check 3: TYPE_VALID (5 points)
 */
function checkTypeValid(metadata: Record<string, unknown> | null): CheckResult {
  const check: CheckResult = {
    check: 'TYPE_VALID',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'metadata',
  };

  if (!metadata) {
    check.details = 'No metadata';
    return check;
  }

  const expectedType = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  if (metadata.type === expectedType) {
    check.points = 5;
    check.passed = true;
    check.details = 'Correct ERC-8004 type';
  } else if (metadata.type) {
    check.details = `Type "${metadata.type}" does not match expected`;
  } else {
    check.details = 'No type field in metadata';
  }

  return check;
}

/**
 * Check 4: REGISTRATIONS_MATCH (10 points)
 */
function checkRegistrationsMatch(metadata: Record<string, unknown> | null): CheckResult {
  const check: CheckResult = {
    check: 'REGISTRATIONS_MATCH',
    points: 0,
    maxPoints: 10,
    passed: false,
    details: '',
    category: 'metadata',
  };

  if (!metadata) {
    check.details = 'No metadata';
    return check;
  }

  const registrations = metadata.registrations as Array<string | { agentRegistry?: string; agentId?: number }> | undefined;
  if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
    check.details = 'No registrations array or empty';
    return check;
  }

  // Check CAIP-10 format: eip155:<chainId>:<address>
  // Supports both string format and object format { agentRegistry: "eip155:..." }
  const caip10Regex = /^eip155:\d+:0x[a-fA-F0-9]{40}$/;
  const extractedRegs = registrations.map(r => {
    if (typeof r === 'string') return r;
    if (typeof r === 'object' && r.agentRegistry) return r.agentRegistry;
    return '';
  });
  const validRegs = extractedRegs.filter(r => caip10Regex.test(r));
  const hasPlaceholders = extractedRegs.some(r =>
    r.includes('YOUR_') || r.includes('PLACEHOLDER')
  );

  if (hasPlaceholders) {
    check.details = 'Registrations contain placeholder values';
    return check;
  }

  if (validRegs.length === registrations.length) {
    check.points = 10;
    check.passed = true;
    check.details = `${validRegs.length} valid CAIP-10 registration(s)`;
  } else if (validRegs.length > 0) {
    check.points = 5;
    check.details = `${validRegs.length}/${registrations.length} valid CAIP-10 format`;
  } else {
    check.details = 'No registrations in valid CAIP-10 format';
  }

  return check;
}

/**
 * Check 5: WALLET_CAIP10 (5 points)
 */
function checkWalletCaip10(metadata: Record<string, unknown> | null): CheckResult {
  const check: CheckResult = {
    check: 'WALLET_CAIP10',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'metadata',
  };

  if (!metadata) {
    check.details = 'No metadata';
    return check;
  }

  const wallet = metadata.wallet as string | undefined;
  if (!wallet) {
    // No wallet is OK (optional field)
    check.points = 5;
    check.passed = true;
    check.details = 'No wallet declared (optional field)';
    return check;
  }

  const caip10Regex = /^eip155:\d+:0x[a-fA-F0-9]{40}$/;
  if (caip10Regex.test(wallet)) {
    check.points = 5;
    check.passed = true;
    check.details = `Wallet in valid CAIP-10 format`;
  } else {
    check.details = `Wallet "${wallet}" not in CAIP-10 format`;
  }

  return check;
}

/**
 * Check 6: X402_WALLET_REQUIRED (5 points)
 */
/**
 * Extract wallet address from metadata (checks multiple locations)
 */
function extractWallet(metadata: Record<string, unknown>): string | null {
  // Direct wallet field
  if (metadata.wallet && typeof metadata.wallet === 'string') return metadata.wallet;
  // Registrations with CAIP-10 → extract address
  const regs = metadata.registrations as Array<{ agentRegistry?: string }> | undefined;
  if (regs && Array.isArray(regs)) {
    for (const r of regs) {
      const reg = typeof r === 'string' ? r : r.agentRegistry;
      if (reg) {
        const match = reg.match(/0x[a-fA-F0-9]{40}/);
        if (match) return match[0]; // registry address, not wallet — but it's something
      }
    }
  }
  // x402 signals endpoint service
  const services = metadata.services as Array<{ name?: string; endpoint?: string }> | undefined;
  if (services) {
    const x402Svc = services.find(s => s.name?.includes('x402'));
    if (x402Svc?.endpoint) return 'declared-via-service';
  }
  return null;
}

function checkX402WalletRequired(metadata: Record<string, unknown> | null): CheckResult {
  const check: CheckResult = {
    check: 'X402_WALLET_REQUIRED',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'metadata',
  };

  if (!metadata) {
    check.details = 'No metadata';
    return check;
  }

  const x402Support = metadata.x402Support as boolean | undefined;

  if (!x402Support) {
    check.points = 5;
    check.passed = true;
    check.details = 'x402Support not declared';
    return check;
  }

  const wallet = extractWallet(metadata);
  if (wallet) {
    check.points = 5;
    check.passed = true;
    check.details = 'x402Support=true and wallet/payment info present';
  } else {
    check.details = 'x402Support=true but no wallet declared';
  }

  return check;
}

// ============================================
// INFRASTRUCTURE CHECKS (7-14) — 35 points max
// ============================================

/**
 * Check 7: TLS_VALID (5 points) — CRITICAL
 */
async function checkTlsValid(baseUrl: string | null): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'TLS_VALID',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL available';
    return check;
  }

  if (!baseUrl.startsWith('https://')) {
    check.details = 'URL does not use HTTPS';
    return check;
  }

  try {
    const res = await safeFetch(baseUrl, { timeout: 5000 });
    if (res) {
      check.points = 5;
      check.passed = true;
      check.details = 'HTTPS connection successful (TLS valid)';
    } else {
      check.details = 'Could not establish HTTPS connection';
    }
  } catch {
    check.details = 'TLS connection failed';
  }

  return check;
}

/**
 * Check 8: HEALTH_2XX (5 points) — CRITICAL
 */
async function checkHealth2xx(baseUrl: string | null): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'HEALTH_2XX',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL available';
    return check;
  }

  const healthPaths = ['/api/health', '/health', '/api/v1/health'];
  for (const path of healthPaths) {
    const start = Date.now();
    const res = await safeFetch(`${baseUrl}${path}`, { timeout: 3000 });
    const latency = Date.now() - start;

    if (res && res.status >= 200 && res.status < 300) {
      if (latency <= 2000) {
        check.points = 5;
        check.passed = true;
        check.details = `${path} returned ${res.status} in ${latency}ms`;
      } else {
        check.points = 2;
        check.details = `${path} returned ${res.status} but slow (${latency}ms > 2000ms)`;
      }
      return check;
    }
  }

  check.details = 'No health endpoint returned 2xx';
  return check;
}

/**
 * Check 9: LATENCY_P95_OK (5 points)
 */
async function checkLatencyP95(baseUrl: string | null): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'LATENCY_P95_OK',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL available';
    return check;
  }

  const latencies: number[] = [];
  const healthPath = '/api/health';

  // Run 5 probes (not 10 to keep validation fast)
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const res = await safeFetch(`${baseUrl}${healthPath}`, { timeout: 3000 });
    if (res) {
      latencies.push(Date.now() - start);
    }
  }

  if (latencies.length === 0) {
    check.details = 'All probes failed';
    return check;
  }

  latencies.sort((a, b) => a - b);
  // P95 = max of sorted values for 5 samples
  const p95 = latencies[Math.min(Math.ceil(latencies.length * 0.95) - 1, latencies.length - 1)];

  if (p95 < 2000) {
    check.points = 5;
    check.passed = true;
    check.details = `p95 latency: ${p95}ms (< 2000ms)`;
  } else {
    check.details = `p95 latency: ${p95}ms (> 2000ms threshold)`;
  }

  return check;
}

/**
 * Check 10: ERROR_RATE_OK (5 points)
 */
async function checkErrorRate(baseUrl: string | null): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'ERROR_RATE_OK',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL available';
    return check;
  }

  const endpoints = ['/', '/api/health'];
  let total = 0;
  let errors = 0;

  for (const endpoint of endpoints) {
    const res = await safeFetch(`${baseUrl}${endpoint}`, { timeout: 5000 });
    total++;
    if (!res || res.status >= 500) {
      errors++;
    }
  }

  const errorRate = total > 0 ? (errors / total) * 100 : 100;

  if (errorRate < 5) {
    check.points = 5;
    check.passed = true;
    check.details = `Error rate: ${errorRate.toFixed(1)}% (< 5%)`;
  } else {
    check.details = `Error rate: ${errorRate.toFixed(1)}% (>= 5%)`;
  }

  return check;
}

/**
 * Check 11: A2A_CARD_ACCESSIBLE (3 points)
 */
async function checkA2aCardAccessible(
  baseUrl: string | null,
  metadata: Record<string, unknown> | null
): Promise<{ result: CheckResult; cardJson: Record<string, unknown> | null }> {
  const check: CheckResult = {
    check: 'A2A_CARD_ACCESSIBLE',
    points: 0,
    maxPoints: 3,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL';
    return { result: check, cardJson: null };
  }

  // Only check if A2A is declared in services
  const hasA2a = hasServiceType(metadata || {}, 'a2a');

  const res = await safeFetch(`${baseUrl}/.well-known/agent-card.json`, { timeout: 5000 });
  if (res && res.status === 200) {
    try {
      const json = await res.json();
      check.points = 3;
      check.passed = true;
      check.details = 'agent-card.json accessible';
      return { result: check, cardJson: json as Record<string, unknown> };
    } catch {
      check.details = 'agent-card.json returned invalid JSON';
    }
  } else if (!hasA2a) {
    // A2A not declared, skip
    check.points = 3;
    check.passed = true;
    check.details = 'A2A not declared in services (skipped)';
  } else {
    check.details = `agent-card.json returned ${res?.status || 'no response'}`;
  }

  return { result: check, cardJson: null };
}

/**
 * Check 12: A2A_CARD_VALID (3 points)
 */
function checkA2aCardValid(
  cardJson: Record<string, unknown> | null,
  metadata: Record<string, unknown> | null
): CheckResult {
  const check: CheckResult = {
    check: 'A2A_CARD_VALID',
    points: 0,
    maxPoints: 3,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  const hasA2a = hasServiceType(metadata || {}, 'a2a');

  if (!cardJson) {
    if (!hasA2a) {
      check.points = 3;
      check.passed = true;
      check.details = 'A2A not declared (skipped)';
    } else {
      check.details = 'No card JSON to validate';
    }
    return check;
  }

  const hasName = typeof cardJson.name === 'string' && cardJson.name.length > 0;
  const hasDesc = typeof cardJson.description === 'string';

  // Check for skills at top level OR inside A2A service (common ERC-8004 pattern)
  let hasSkills = Array.isArray(cardJson.skills);
  if (!hasSkills) {
    const services = cardJson.services as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(services)) {
      const a2aService = services.find(
        (s) => typeof s.name === 'string' && s.name.toLowerCase() === 'a2a'
      );
      if (a2aService) {
        hasSkills = Array.isArray(a2aService.a2aSkills) || Array.isArray(a2aService.skills);
      }
    }
    // Also check top-level capabilities as skills equivalent
    if (!hasSkills) {
      hasSkills = Array.isArray(cardJson.capabilities) && (cardJson.capabilities as unknown[]).length > 0;
    }
  }

  if (hasName && hasDesc && hasSkills) {
    check.points = 3;
    check.passed = true;
    check.details = 'Valid A2A card: name, description, skills present';
  } else {
    const missing = [];
    if (!hasName) missing.push('name');
    if (!hasDesc) missing.push('description');
    if (!hasSkills) missing.push('skills');
    check.details = `A2A card missing: ${missing.join(', ')}`;
  }

  return check;
}

/**
 * Check 13: MCP_ENDPOINT_OK (4 points)
 */
async function checkMcpEndpoint(
  baseUrl: string | null,
  metadata: Record<string, unknown> | null
): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'MCP_ENDPOINT_OK',
    points: 0,
    maxPoints: 4,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL';
    return check;
  }

  const hasMcp = hasServiceType(metadata || {}, 'mcp');

  const res = await safeFetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
    timeout: 5000,
  });

  if (res && (res.status === 200 || res.status === 405)) {
    check.points = 4;
    check.passed = true;
    check.details = `MCP endpoint reachable (${res.status})`;
  } else if (!hasMcp) {
    check.points = 4;
    check.passed = true;
    check.details = 'MCP not declared in services (skipped)';
  } else {
    check.details = `MCP endpoint returned ${res?.status || 'no response'}`;
  }

  return check;
}

/**
 * Check 14: MCP_LISTTOOLS_OK (5 points)
 */
async function checkMcpListTools(
  baseUrl: string | null,
  metadata: Record<string, unknown> | null
): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'MCP_LISTTOOLS_OK',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'infrastructure',
  };

  if (!baseUrl) {
    check.details = 'No base URL';
    return check;
  }

  const hasMcp = hasServiceType(metadata || {}, 'mcp');

  const res = await safeFetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    timeout: 5000,
  });

  if (res && res.ok) {
    try {
      const json = await res.json() as { result?: { tools?: unknown[] } };
      if (json.result?.tools && Array.isArray(json.result.tools)) {
        check.points = 5;
        check.passed = true;
        check.details = `${json.result.tools.length} tool(s) listed`;
      } else {
        check.points = 2;
        check.details = 'MCP responded but no tools array in result';
      }
    } catch {
      check.details = 'MCP tools/list returned invalid JSON';
    }
  } else if (!hasMcp) {
    check.points = 5;
    check.passed = true;
    check.details = 'MCP not declared (skipped)';
  } else {
    check.details = `MCP tools/list returned ${res?.status || 'no response'}`;
  }

  return check;
}

// ============================================
// AWS CHECKS (15-22) — 25 points max
// N/A without AWS credentials
// ============================================

function awsCheckNA(checkName: string, maxPoints: number): CheckResult {
  return {
    check: checkName,
    points: 0,
    maxPoints,
    passed: false,
    details: 'AWS checks require credentials (N/A)',
    category: 'aws',
  };
}

// ============================================
// x402 CHECKS (23-24) — 10 points max
// ============================================

/**
 * Check 23: X402_CHALLENGE_OK (5 points)
 */
async function checkX402Challenge(
  baseUrl: string | null,
  metadata: Record<string, unknown> | null
): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'X402_CHALLENGE_OK',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'x402',
  };

  const x402Support = metadata?.x402Support as boolean | undefined;

  if (!x402Support) {
    check.points = 5;
    check.passed = true;
    check.details = 'x402 not declared (skipped)';
    return check;
  }

  if (!baseUrl) {
    check.details = 'No base URL';
    return check;
  }

  // Build list of paths to check: dynamic from metadata + standard fallbacks
  const paidPaths = new Set<string>();

  // Extract x402 endpoints from services metadata
  if (metadata) {
    const services = metadata.services as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(services)) {
      for (const svc of services) {
        const svcEndpoint = (svc.endpoint || svc.url) as string | undefined;
        if (svcEndpoint && typeof svcEndpoint === 'string') {
          try {
            const u = new URL(svcEndpoint);
            paidPaths.add(u.pathname === '/' ? '' : u.pathname);
          } catch { /* skip */ }
        }
      }
    }
    // Check for explicit x402 endpoint declarations
    const x402Endpoint = metadata.x402Endpoint as string | undefined;
    if (x402Endpoint) {
      try {
        const u = new URL(x402Endpoint, baseUrl);
        paidPaths.add(u.pathname);
      } catch { /* skip */ }
    }
  }

  // Add standard fallback paths
  paidPaths.add('/api/premium');
  paidPaths.add('/api/paid');
  paidPaths.add('/api/v1/premium');
  paidPaths.add('/api/signals');
  paidPaths.add('/api/analyze');
  paidPaths.add('/a2a/guide');

  // Helper to check if a 402 response has valid x402 info
  const check402Response = async (res: Response, path: string): Promise<boolean> => {
    // Check HTTP headers (standard x402)
    const payAddr = res.headers.get('x-payment-address')
      || res.headers.get('x-402-payto')
      || res.headers.get('x-402-recipient');
    const hasWWWAuth = res.headers.get('www-authenticate')?.includes('x402');

    if (payAddr || hasWWWAuth) {
      check.points = 5;
      check.passed = true;
      const display = payAddr ? payAddr.slice(0, 10) + '...' : 'x402 auth';
      check.details = `402 challenge at ${path}, payment: ${display}`;
      return true;
    }

    // Check JSON body for x402 payment info (alternative format)
    try {
      const body = await res.json();
      const hasAccepts = Array.isArray(body.accepts) && body.accepts.length > 0;
      const hasPayTo = hasAccepts && body.accepts[0]?.payTo;
      const hasX402Version = body.x402Version !== undefined;
      if (hasPayTo || hasX402Version) {
        check.points = 5;
        check.passed = true;
        const display = hasPayTo ? body.accepts[0].payTo.slice(0, 10) + '...' : 'x402 JSON';
        check.details = `402 challenge at ${path}, payment: ${display}`;
        return true;
      }
    } catch { /* not JSON */ }

    check.points = 3;
    check.passed = true;
    check.details = `402 returned at ${path} (non-standard format)`;
    return true;
  };

  // Try GET first, then POST for each path
  for (const path of paidPaths) {
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

    // Try GET
    const getRes = await safeFetch(url, { timeout: 5000 });
    if (getRes && getRes.status === 402) {
      if (await check402Response(getRes, path)) return check;
    }

    // Try POST (some x402 endpoints only respond to POST)
    const postRes = await safeFetch(url, {
      timeout: 5000,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (postRes && postRes.status === 402) {
      if (await check402Response(postRes, path)) return check;
    }
  }

  check.details = 'No 402 challenge response from known endpoints';
  return check;
}

/**
 * Check 24: X402_WALLET_CONSISTENT (5 points)
 */
function checkX402WalletConsistent(metadata: Record<string, unknown> | null): CheckResult {
  const check: CheckResult = {
    check: 'X402_WALLET_CONSISTENT',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'x402',
  };

  const x402Support = metadata?.x402Support as boolean | undefined;

  if (!x402Support) {
    check.points = 5;
    check.passed = true;
    check.details = 'x402 not declared (skipped)';
    return check;
  }

  const wallet = metadata ? extractWallet(metadata) : null;
  if (wallet) {
    check.points = 5;
    check.passed = true;
    check.details = 'Wallet/payment info declared for x402';
  } else {
    check.details = 'x402 enabled but wallet missing or invalid';
  }

  return check;
}

// ============================================
// BONUS CHECKS (25-27) — 10 points max
// ============================================

/**
 * Check 25: FIRST_VALIDATION (5 points)
 */
async function checkFirstValidation(agentAddress: string): Promise<CheckResult> {
  const check: CheckResult = {
    check: 'FIRST_VALIDATION',
    points: 0,
    maxPoints: 5,
    passed: false,
    details: '',
    category: 'bonus',
  };

  const existing = await prisma.sentinelValidation.findFirst({
    where: { agentAddress: agentAddress.toLowerCase() },
  });

  if (!existing) {
    check.points = 5;
    check.passed = true;
    check.details = 'First-time validation bonus';
  } else {
    check.details = 'Previous validation exists (no bonus)';
  }

  return check;
}

// ============================================
// MAIN VALIDATION ENGINE
// ============================================

/**
 * Run all 27 Super Sentinel validation checks on an agent
 */
export async function validateAgent(agentAddress: string): Promise<ValidationResult> {
  const startTime = Date.now();
  const normalizedAddress = agentAddress.toLowerCase();

  logger.info({ agentAddress: normalizedAddress }, 'Starting Super Sentinel validation');

  // Load agent from DB
  const agent = await prisma.agent.findUnique({
    where: { address: normalizedAddress },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${agentAddress}`);
  }

  const checks: CheckResult[] = [];

  // ---- METADATA CHECKS (1-6) ----
  const { result: check1, metadata } = await checkAgentUrlParseable({
    token_id: agent.token_id,
    token_uri: agent.token_uri,
    metadata: agent.metadata,
  });
  checks.push(check1);
  checks.push(checkMetadataComplete(metadata));
  checks.push(checkTypeValid(metadata));
  checks.push(checkRegistrationsMatch(metadata));
  checks.push(checkWalletCaip10(metadata));
  checks.push(checkX402WalletRequired(metadata));

  // ---- INFRASTRUCTURE CHECKS (7-14) ----
  const baseUrl = extractBaseUrl(metadata || {});

  // Run infra checks in parallel for speed
  const [
    check7,
    check8,
    check9,
    check10,
    check11Result,
    check13,
    check14,
  ] = await Promise.all([
    checkTlsValid(baseUrl),
    checkHealth2xx(baseUrl),
    checkLatencyP95(baseUrl),
    checkErrorRate(baseUrl),
    checkA2aCardAccessible(baseUrl, metadata),
    checkMcpEndpoint(baseUrl, metadata),
    checkMcpListTools(baseUrl, metadata),
  ]);

  checks.push(check7);
  checks.push(check8);
  checks.push(check9);
  checks.push(check10);
  checks.push(check11Result.result);
  checks.push(checkA2aCardValid(check11Result.cardJson, metadata));
  checks.push(check13);
  checks.push(check14);

  // ---- AWS CHECKS (15-22) — N/A ----
  checks.push(awsCheckNA('AWS_EC2_STATUS_OK', 5));
  checks.push(awsCheckNA('AWS_EC2_CPU_OK', 3));
  checks.push(awsCheckNA('AWS_ALB_TARGETS_HEALTHY', 5));
  checks.push(awsCheckNA('AWS_ALB_ERROR_RATE_OK', 3));
  checks.push(awsCheckNA('AWS_CLOUDWATCH_ALARMS_OK', 3));
  checks.push(awsCheckNA('AWS_LOGS_RECENT', 2));
  checks.push(awsCheckNA('AWS_SECURITY_GROUPS_OK', 2));
  checks.push(awsCheckNA('AWS_WAF_ENABLED', 2));

  // ---- x402 CHECKS (23-24) ----
  checks.push(await checkX402Challenge(baseUrl, metadata));
  checks.push(checkX402WalletConsistent(metadata));

  // ---- BONUS CHECKS (25-27) ----
  checks.push(await checkFirstValidation(normalizedAddress));
  // 26: X402_VERIFIED — requires real payment, skip
  checks.push({
    check: 'X402_VERIFIED',
    points: 0,
    maxPoints: 3,
    passed: false,
    details: 'Requires test payment (not automated)',
    category: 'bonus',
  });
  // 27: AWS_FULL_CHECKS — aggregate of AWS
  checks.push({
    check: 'AWS_FULL_CHECKS',
    points: 0,
    maxPoints: 2,
    passed: false,
    details: 'Requires AWS credentials',
    category: 'bonus',
  });

  // ---- CALCULATE TOTALS ----
  const totalScore = checks.reduce((sum, c) => sum + c.points, 0);

  // Max score excludes N/A and unachievable checks
  const awsNA = checks.filter(c => c.category === 'aws').every(c => c.details.includes('N/A'));
  let maxScore = awsNA
    ? 120 - 25 - 2 - 3 // 90 achievable without AWS + x402_verified + aws_full
    : 120;

  // Exclude FIRST_VALIDATION bonus from max if already consumed (one-time bonus)
  const firstValCheck = checks.find(c => c.check === 'FIRST_VALIDATION');
  if (firstValCheck && !firstValCheck.passed && firstValCheck.details.includes('Previous validation')) {
    maxScore -= firstValCheck.maxPoints;
  }

  // Normalized score for verdict (percentage of achievable)
  const normalizedPct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const verdict: 'PASS' | 'PARTIAL' | 'FAIL' =
    normalizedPct >= 70 ? 'PASS' : normalizedPct >= 40 ? 'PARTIAL' : 'FAIL';

  // Critical failures
  const criticalChecks = ['AGENTURL_PARSEABLE', 'TLS_VALID', 'HEALTH_2XX'];
  const criticalFailures = checks
    .filter(c => criticalChecks.includes(c.check) && !c.passed)
    .map(c => c.check);

  // Override verdict if critical checks fail
  const finalVerdict = criticalFailures.length > 0 && verdict === 'PASS' ? 'PARTIAL' : verdict;

  const categories = {
    metadata: checks.filter(c => c.category === 'metadata').reduce((s, c) => s + c.points, 0),
    infrastructure: checks.filter(c => c.category === 'infrastructure').reduce((s, c) => s + c.points, 0),
    aws: checks.filter(c => c.category === 'aws').reduce((s, c) => s + c.points, 0),
    x402: checks.filter(c => c.category === 'x402').reduce((s, c) => s + c.points, 0),
    bonus: checks.filter(c => c.category === 'bonus').reduce((s, c) => s + c.points, 0),
  };

  const duration = Date.now() - startTime;

  const result: ValidationResult = {
    agentAddress: normalizedAddress,
    totalScore,
    maxScore,
    verdict: finalVerdict,
    categories,
    checks,
    criticalFailures,
    duration,
  };

  // Save validation result to database
  await prisma.sentinelValidation.create({
    data: {
      agentAddress: normalizedAddress,
      totalScore,
      maxScore,
      verdict: finalVerdict,
      metadataScore: categories.metadata,
      infrastructureScore: categories.infrastructure,
      awsScore: categories.aws,
      x402Score: categories.x402,
      bonusScore: categories.bonus,
      checks: JSON.parse(JSON.stringify(checks)),
    },
  });

  // Update agent status and verified_tier based on verdict
  // Never touch FLAGGED or SUSPENDED (community/admin actions)
  if (agent.status !== 'FLAGGED' && agent.status !== 'SUSPENDED') {
    if (finalVerdict === 'PASS') {
      // Sentinel PASS → VERIFIED status + SENTINEL tier (preserve PREMIUM if already set)
      const updateData: Record<string, unknown> = { status: 'VERIFIED' as const };
      if (agent.verified_tier !== 'PREMIUM') {
        updateData.verified_tier = 'SENTINEL';
        if (!agent.verified_at) {
          updateData.verified_at = new Date();
        }
      }
      if (agent.status !== 'VERIFIED' || (!agent.verified_tier && agent.verified_tier !== 'PREMIUM')) {
        await prisma.agent.update({
          where: { address: normalizedAddress },
          data: updateData,
        });
        logger.info({
          agentAddress: normalizedAddress,
          oldStatus: agent.status,
          newStatus: 'VERIFIED',
          tier: updateData.verified_tier ?? agent.verified_tier,
          verdict: finalVerdict,
        }, 'Agent status updated by Sentinel');
      }
    } else {
      // Sentinel FAIL/PARTIAL → PENDING + clear tier (even Premium loses verification)
      if (agent.status !== 'PENDING') {
        await prisma.agent.update({
          where: { address: normalizedAddress },
          data: {
            status: 'PENDING',
            verified_tier: null,
          },
        });
        logger.info({
          agentAddress: normalizedAddress,
          oldStatus: agent.status,
          oldTier: agent.verified_tier,
          newStatus: 'PENDING',
          verdict: finalVerdict,
        }, 'Agent demoted by Sentinel (tier cleared)');
      }
    }
  }

  logger.info({
    agentAddress: normalizedAddress,
    totalScore,
    maxScore,
    verdict: finalVerdict,
    criticalFailures,
    duration: `${duration}ms`,
  }, 'Validation completed');

  return result;
}

/**
 * Validate all agents in the registry
 * Used by cron job
 */
export async function validateAllAgents(): Promise<{
  validated: number;
  passed: number;
  partial: number;
  failed: number;
  errors: number;
}> {
  logger.info('Starting batch validation for all agents');

  const agents = await prisma.agent.findMany({
    where: {
      status: { notIn: ['SUSPENDED'] },
    },
    select: { address: true },
  });

  let passed = 0;
  let partial = 0;
  let failed = 0;
  let errors = 0;

  // Process in batches of 5 to avoid overwhelming external services
  const batchSize = 5;
  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(a => validateAgent(a.address))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        switch (result.value.verdict) {
          case 'PASS': passed++; break;
          case 'PARTIAL': partial++; break;
          case 'FAIL': failed++; break;
        }
      } else {
        errors++;
        logger.error({ error: result.reason }, 'Agent validation failed');
      }
    }
  }

  const summary = {
    validated: agents.length,
    passed,
    partial,
    failed,
    errors,
  };

  logger.info(summary, 'Batch validation completed');
  return summary;
}

/**
 * Get latest validation result for an agent
 */
export async function getLatestValidation(agentAddress: string) {
  return prisma.sentinelValidation.findFirst({
    where: { agentAddress: agentAddress.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  });
}
