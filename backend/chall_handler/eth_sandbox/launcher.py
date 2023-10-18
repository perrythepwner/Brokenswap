import json
import os
import random
import string
import time
from pathlib import Path
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional
from uuid import UUID

import requests
from eth_account import Account
from web3 import Web3
from web3.exceptions import TransactionNotFound
from web3.types import TxReceipt

from eth_sandbox import get_shared_secret

SRV_PORT = os.getenv("SRV_PORT", "8888")
PUBLIC_IP = os.getenv("PUBLIC_IP", "127.0.0.1")

TEAM_UUID = os.getenv("TEAM_UUID", "team")
FLAG = os.getenv("FLAG", "HTB{placeholder}")

Account.enable_unaudited_hdwallet_features()


@dataclass
class Action:
    name: str
    handler: Callable[[], int]


def sendTransaction(web3: Web3, tx: Dict) -> Optional[TxReceipt]:
    if "gas" not in tx:
        tx["gas"] = 10_000_000

    if "gasPrice" not in tx:
        tx["gasPrice"] = 0

    web3.provider.make_request("anvil_impersonateAccount", [tx["from"]])
    txhash = web3.eth.sendTransaction(tx)
    web3.provider.make_request("anvil_stopImpersonatingAccount", [tx["from"]])

    while True:
        try:
            rcpt = web3.eth.getTransactionReceipt(txhash)
            break
        except TransactionNotFound:
            time.sleep(0.1)

    if rcpt.status != 1:
        raise Exception("failed to send transaction")

    return rcpt

def new_launch_instance_action(
    do_deploy: Callable[[Web3, str], str],
    getChallengeAddress: Callable[[Web3, str], str]
):
    def action() -> int:
        data = requests.post(
            f"http://127.0.0.1:{SRV_PORT}/new",
            headers={
                "Authorization": f"Bearer {get_shared_secret()}",
                "Content-Type": "application/json",
            },
            data=json.dumps(
                {
                    "team_id": TEAM_UUID,
                }
            ),
        ).json()

        if data["ok"] == False:
            print(data["message"])
            return 1

        uuid = data["uuid"]
        mnemonic = data["mnemonic"]
        
        deployer_acct = Account.from_mnemonic(mnemonic, account_path=f"m/44'/60'/0'/0/0")
        player_acct = Account.from_mnemonic(mnemonic, account_path=f"m/44'/60'/0'/0/1")

        web3 = Web3(Web3.HTTPProvider(
            f"http://127.0.0.1:{SRV_PORT}/{uuid}",
            request_kwargs={
                "headers": {
                    "Authorization": f"Bearer {get_shared_secret()}",
                    "Content-Type": "application/json",
                },
            },
        ))

        setup_addr = do_deploy(web3, deployer_acct.address, player_acct.address)
        target_addr, weth_addr, htb_addr = getChallengeAddress(web3, setup_addr)

        with open(f"/tmp/{TEAM_UUID}", "w") as f:
            f.write(
                json.dumps(
                    {
                        "uuid": uuid,
                        "mnemonic": mnemonic,
                        "address": setup_addr,
                    }
                )
            )

        print()
        print(f"your private blockchain has been deployed")
        print(f"it will automatically terminate in 30 minutes")
        print(f"here's your connection info:")
        print(f"team uuid:              {uuid}")
        print(f"rpc endpoint:           http://{PUBLIC_IP}:{SRV_PORT}/{uuid}")
        print(f"player private key:     {player_acct.privateKey.hex()}")
        print(f"player address:         {player_acct.address}")
        print(f"setup contract:         {setup_addr}")
        print(f"target contract:        {target_addr}")
        print(f"WETH token contract:    {weth_addr}")
        print(f"HTB token contract:     {htb_addr}")
        return 0

    return Action(name="launch new instance", handler=action)


def new_kill_instance_action():
    def action() -> int:
        data = requests.post(
            f"http://127.0.0.1:{SRV_PORT}/kill",
            headers={
                "Authorization": f"Bearer {get_shared_secret()}",
                "Content-Type": "application/json",
            },
            data=json.dumps(
                {
                    "team_id": TEAM_UUID,
                }
            ),
        ).json()

        print(data["message"])
        return 1

    return Action(name="kill instance", handler=action)

def is_solved_checker(web3: Web3, addr: str) -> bool:
    result = web3.eth.call(
        {
            "to": addr,
            "data": web3.sha3(text="isSolved()")[:4],
        }
    )
    return int(result.hex(), 16) == 1


def new_get_flag_action(
    checker: Callable[[Web3, str], bool] = is_solved_checker,
):
    def action() -> int:
        try:
            with open(f"/tmp/{TEAM_UUID}", "r") as f:
                data = json.loads(f.read())
        except:
            print("team instance not found, launch a new instance first")
            return 1

        web3 = Web3(Web3.HTTPProvider(f"http://127.0.0.1:{SRV_PORT}/{data['uuid']}"))

        if not checker(web3, data['address']):
            print("are you sure you solved it?")
            return 1

        print(FLAG)
        print()
        return 0

    return Action(name="get flag", handler=action)


def run_launcher(actions: List[Action]):
    for i, action in enumerate(actions):
        print(f"{i+1} - {action.name}")

    action = int(input("action? ")) - 1
    if action < 0 or action >= len(actions):
        print("can you not")
        exit(1)

    exit(actions[action].handler())
