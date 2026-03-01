/**
 * Enigma Type Definitions
 */

export type { Database, Json } from './database';

/**
 * Agent Categories
 */
export const AGENT_CATEGORIES = [
  'defi',
  'trading',
  'nft',
  'governance',
  'oracle',
  'bridge',
  'utility',
  'social',
  'gaming',
  'other',
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

/**
 * Trust Score Levels
 */
export type TrustLevel = 'excellent' | 'good' | 'medium' | 'low';

/**
 * Agent entity
 */
export interface Agent {
  id: string;
  contractAddress: string;
  name: string;
  description: string | null;
  category: AgentCategory;
  chainId: number;
  ownerAddress: string;
  isVerified: boolean;
  isFlagged: boolean;
  verifiedAt: Date | null;
  flaggedAt: Date | null;
  flagReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  trustScore?: TrustScore;
}

/**
 * Trust Score entity (v1 — stored in DB snapshots)
 */
export interface TrustScore {
  id: string;
  agentId: string;
  overallScore: number;
  volumeScore: number;
  proxyScore: number;
  uptimeScore: number;
  ozMatchScore: number;
  communityScore: number;
  calculatedAt: Date;
  snapshotData: Record<string, unknown> | null;
}

/**
 * Trust Score v2 Weights (Combined: 4 pillars)
 * Infrastructure 50% + Community 20% + Correlation 15% + RL 15%
 */
export const TRUST_SCORE_V2_WEIGHTS = {
  infrastructure: 0.50,
  community: 0.20,
  correlation: 0.15,
  rl: 0.15,
} as const;

/**
 * Trust Score v1 Weights (legacy, used internally)
 */
export const TRUST_SCORE_WEIGHTS = {
  volume: 0.25,
  proxy: 0.2,
  uptime: 0.25,
  ozMatch: 0.15,
  community: 0.15,
} as const;

/**
 * Rating entity
 */
export interface Rating {
  id: string;
  agentId: string;
  userAddress: string;
  rating: number;
  review: string | null;
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User entity
 */
export interface User {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scanner Result entity
 */
export interface ScannerResult {
  id: string;
  agentId: string;
  scanType: 'bytecode' | 'transaction' | 'pattern' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: ScannerFinding[] | null;
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * Scanner Finding
 */
export interface ScannerFinding {
  type: 'info' | 'warning' | 'critical';
  code: string;
  message: string;
  details: Record<string, unknown> | null;
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters for agents
 */
export interface AgentFilters {
  category?: AgentCategory;
  chainId?: number;
  isVerified?: boolean;
  minTrustScore?: number;
  search?: string;
}
