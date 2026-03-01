// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEnigmaBurn {
    event BurnExecuted(uint256 indexed burnId, uint256 usdcAmount, uint256 nativeAmount, uint256 timestamp);

    function burn(uint256 amount) external;
    function getStats() external view returns (uint256, uint256, uint256);
    function previewBurn(uint256 amount) external view returns (uint256);
    function totalBurnedUSD() external view returns (uint256);
    function totalBurnedNative() external view returns (uint256);
    function burnCount() external view returns (uint256);
}
