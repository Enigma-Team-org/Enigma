export const ENIGMA_BURN_ABI = [
  {
    type: 'event',
    name: 'BurnExecuted',
    inputs: [
      { name: 'burnId', type: 'uint256', indexed: true },
      { name: 'usdcAmount', type: 'uint256', indexed: false },
      { name: 'nativeAmount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'getStats',
    inputs: [],
    outputs: [
      { name: '_totalBurnedUSD', type: 'uint256' },
      { name: '_totalBurnedNative', type: 'uint256' },
      { name: '_burnCount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'previewBurn',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalBurnedUSD',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalBurnedNative',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'burnCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// Contract addresses per chain (to be updated after deployment)
export const BURN_CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  43114: '0x0000000000000000000000000000000000000000', // Avalanche - TBD
};
