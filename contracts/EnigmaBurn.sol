// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IDEXRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

contract EnigmaBurn is Ownable, ReentrancyGuard {

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant MIN_BURN_AMOUNT = 1e6; // $1 minimum (USDC 6 decimals)

    IDEXRouter public immutable dexRouter;
    address public immutable wrappedNative;
    address public immutable usdc;

    uint256 public totalBurnedUSD;
    uint256 public totalBurnedNative;
    uint256 public burnCount;

    event BurnExecuted(
        uint256 indexed burnId,
        uint256 usdcAmount,
        uint256 nativeAmount,
        uint256 timestamp
    );

    constructor(
        address _dexRouter,
        address _wrappedNative,
        address _usdc
    ) Ownable(msg.sender) {
        dexRouter = IDEXRouter(_dexRouter);
        wrappedNative = _wrappedNative;
        usdc = _usdc;
    }

    function burn(uint256 amount) external nonReentrant {
        require(amount >= MIN_BURN_AMOUNT, "Below minimum burn amount");

        IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        IERC20(usdc).approve(address(dexRouter), amount);

        address[] memory path = new address[](2);
        path[0] = usdc;
        path[1] = wrappedNative;

        uint256[] memory amountsOut = dexRouter.getAmountsOut(amount, path);
        uint256 minOut = (amountsOut[1] * 98) / 100;

        uint256[] memory amounts = dexRouter.swapExactTokensForTokens(
            amount,
            minOut,
            path,
            DEAD_ADDRESS,
            block.timestamp + 300
        );

        totalBurnedUSD += amount;
        totalBurnedNative += amounts[1];
        burnCount++;

        emit BurnExecuted(burnCount, amount, amounts[1], block.timestamp);
    }

    function getStats() external view returns (
        uint256 _totalBurnedUSD,
        uint256 _totalBurnedNative,
        uint256 _burnCount
    ) {
        return (totalBurnedUSD, totalBurnedNative, burnCount);
    }

    function previewBurn(uint256 amount) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = usdc;
        path[1] = wrappedNative;
        uint256[] memory amounts = dexRouter.getAmountsOut(amount, path);
        return amounts[1];
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
