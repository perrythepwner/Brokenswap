// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Brokenswap} from "./Brokenswap.sol";
import {FeesPool} from "./FeesPool.sol";
import {WETH9} from "./WETH9.sol";
import {HTBtoken} from "./HTBtoken.sol";

contract Setup {
    Brokenswap public immutable TARGET;
    FeesPool public immutable feesPool;
    WETH9 public immutable weth;
    HTBtoken public immutable htb;

    constructor(address _player) payable {
        require(msg.value == 51 ether);
        htb = new HTBtoken(50e18);
        weth = new WETH9();
        // deploy FeesPool
        feesPool = new FeesPool(address(weth), address(htb));
        // wrapping ETH to WETH and sending tokens to pool reserves
        weth.deposit{value: 50 ether}(); 
        TARGET = new Brokenswap(address(weth), address(htb), 5, address(feesPool));
        weth.transfer(address(TARGET), 50e18);
        htb.transfer(address(TARGET), 50e18);
        // airdrop 10 weth to player
        weth.deposit{value: 1 ether}(); 
        weth.transfer(_player, 1e18);
    }

    function isSolved() public view returns (bool) {
        return (weth.balanceOf(msg.sender) > 1e18);
    }
}
