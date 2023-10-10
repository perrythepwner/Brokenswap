// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Brokenswap, an absolutely not broken AMM DEX 
/// 
contract Brokenswap {
    using SafeERC20 for IERC20;

    uint256 public INVARIANT;
    uint256 public immutable FEERATE;
    address public immutable feesPool;
    mapping(address => bool) public supportedTokens;
    event Swap(address indexed _user, address indexed _inputToken, address indexed _outputToken, uint256 _inputAmount, uint256 _outputAmount, uint256 _fees);    

    constructor (address _tokenA, address _tokenB, uint256 _feeRate, address _feesPoolAddress) payable {
        FEERATE = (_feeRate > 5) ? _feeRate : 5; // 0.5% * 10 = 5
        feesPool = _feesPoolAddress;
        supportedTokens[_tokenA] = true;
        supportedTokens[_tokenB] = true;
    }

    function swap(address _inputToken, address _outputToken, uint256 _inputAmount) public returns (bool) {
        // inputAmount has to be in 18 decimal format, i.e: swap 1 HTB token = 1e18 as _inputAmount 
        // check that pair exists
        require(supportedTokens[_inputToken] == true && supportedTokens[_outputToken] == true, "Token not supported");
        IERC20 inToken = IERC20(_inputToken);
        IERC20 outToken = IERC20(_outputToken);
        // calc invariant here before any tx
        INVARIANT = inToken.balanceOf(address(this)) * outToken.balanceOf(address(this));
        require(inToken.allowance(msg.sender, address(this)) >= _inputAmount, "You should approve transfer first");
        inToken.safeTransferFrom(msg.sender, address(this), _inputAmount);
        // deduct fees on input token
        uint256 fees = _inputAmount * FEERATE / 1000;
        _moveAmountToFeesPool(address(inToken), fees); // move 0.5% swap fee to Liquidity Providers Rewards Pool
        uint256 _outputAmount = calcOutputAmount(address(inToken), address(outToken));
        outToken.safeTransfer(msg.sender, _outputAmount);


        // assert that invariant remained invariant
        //assert(inToken.balanceOf(address(this)) * outToken.balanceOf(address(this)) == INVARIANT, "Something bad happened");
        emit Swap(msg.sender, _inputToken, _outputToken, _inputAmount, _outputAmount, fees);
        return true;
    }

    function _moveAmountToFeesPool(address payingToken, uint256 amount) public returns (bool) {
        require(supportedTokens[payingToken] == true, "Token not supported");
        IERC20(payingToken).safeTransfer(feesPool, amount);
        return true;
    }

    function calcOutputAmount(address inToken, address outToken) public view returns (uint256) {
        require(supportedTokens[inToken] == true && supportedTokens[outToken] == true, "Token not supported");
        uint256 balanceInToken = IERC20(inToken).balanceOf(address(this));
        uint256 balanceOutToken = IERC20(outToken).balanceOf(address(this));

        // x*y = k
        // (x'1)*y1=k, to calculate y1, y1=k/(x'1), k is defined as: k=x0*y0, x'1=x1-fees
        uint256 y1 = INVARIANT / balanceInToken;
        // the Δy (y'1-y1) is the amount that user will receive 
        return (balanceOutToken - y1);
    }

    function balanceOfToken(address _token) public view returns (uint256) {
        require(supportedTokens[_token] == true, "Token not supported");
        return IERC20(_token).balanceOf(address(this));
    }

    // to-do: create fees pool
    // to-do: separate protocol contract from pool contract and fees pool
    // to-do: check existing pool pairs, add liquidity, remove liquidity 
    // to-do: mint tokens, deploy all contracts in setup, check access control, set INVARIANT
}