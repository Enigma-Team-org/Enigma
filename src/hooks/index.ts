/**
 * Custom React hooks for Enigma
 */

export { useRegisterAgent, type RegisterAgentMutation } from './use-register-agent';
export {
  useAgents,
  type Agent,
  type AgentFilters,
  type PaginationMeta,
  type UseAgentsResult,
} from './use-agents';
export {
  useAgent,
  useAgentTrustScore,
  type AgentDetail,
  type PillarComponent,
  type TracerDimension,
  type SentinelSummary,
} from './use-agent';
export {
  useVisitorTracking,
  useVisitorStats,
  type VisitorStats,
} from './use-visitor-tracking';
export { useCreatePayment, useVerifyPayment } from './use-payment';
export { usePaymentHistory } from './use-payment-history';
export { useBurnStats } from './use-burn-stats';
export {
  useServices,
  useService,
  useCreateService,
  useServiceStats,
  type Service,
  type ServiceFilters,
  type ServiceStats,
  type CreateServicePayload,
} from './use-marketplace';
export {
  useDeals,
  useDeal,
  useCreateDeal,
  useUpdateDealStatus,
  useDealMessages,
  useSendMessage,
  type Deal,
  type DealFilters,
  type DealMessage,
  type CreateDealPayload,
  type UpdateDealStatusPayload,
  type SendMessagePayload,
} from './use-deal';
export { useGdpDashboard, useGdpHistory } from './use-gdp';
