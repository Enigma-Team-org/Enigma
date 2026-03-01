/**
 * Centinela Verification Services
 *
 * This module provides verification and monitoring services for autonomous agents:
 * - Proxy detection: Identifies proxy patterns in smart contracts
 * - Heartbeat monitoring: Tracks agent uptime and responsiveness
 * - OZ bytecode matching: Assesses code quality by comparing against OpenZeppelin patterns
 *
 * @see docs/features/trust-score.md
 */

export {
  detectProxy,
  getImplementationAddress,
  type ProxyDetectionResult,
} from './proxy-detector';

export {
  sendHeartbeat,
  calculateUptime,
  getHeartbeatLogs,
  sendHeartbeatsToAllAgents,
  type HeartbeatPingResult,
  type UptimeResult,
  type UptimePeriod,
} from './heartbeat-service';

export {
  matchOZBytecode,
  matchOZBytecodeByAddress,
  type OZMatchResult,
  type OZComponentMatch,
  type MatchConfidence,
} from './oz-matcher';

export {
  validateAgent,
  validateAllAgents,
  getLatestValidation,
  type CheckResult,
  type ValidationResult,
} from './sentinel-validator';
