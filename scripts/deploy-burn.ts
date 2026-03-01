import { ethers } from 'hardhat';

async function main() {
  // Avalanche Mainnet addresses
  const TRADER_JOE_ROUTER = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4';
  const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
  const USDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';

  console.log('Deploying EnigmaBurn...');

  const EnigmaBurn = await ethers.getContractFactory('EnigmaBurn');
  const burn = await EnigmaBurn.deploy(TRADER_JOE_ROUTER, WAVAX, USDC);
  await burn.waitForDeployment();

  const address = await burn.getAddress();
  console.log(`EnigmaBurn deployed to: ${address}`);
  console.log(`  Router: ${TRADER_JOE_ROUTER}`);
  console.log(`  WAVAX:  ${WAVAX}`);
  console.log(`  USDC:   ${USDC}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
