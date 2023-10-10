// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FeesPool is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB; 
    event FeesCollected(IERC20 token, uint256 amount, address indexed collector);
    event FeesWithdrawn(IERC20 token, uint256 amount, address indexed recipient);

    constructor(address _tokenA, address _tokenB) Ownable(msg.sender) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function withdrawFeesTokenA(uint256 amount) public onlyOwner {
        require(amount > 0, "Invalid withdrawal amount");
        tokenA.safeTransfer(msg.sender, amount);
        emit FeesWithdrawn(tokenA, amount, msg.sender);
    }

    function withdrawFeesTokenB(uint256 amount) public onlyOwner {
        require(amount > 0, "Invalid withdrawal amount");
        tokenB.safeTransfer(msg.sender, amount);
        emit FeesWithdrawn(tokenB, amount, msg.sender);
    }

    function balanceTokenA() public view returns (uint256) {
        return tokenA.balanceOf(address(this));
    }

    function balanceTokenB() public view returns (uint256) {
        return tokenB.balanceOf(address(this));
    }    
}
