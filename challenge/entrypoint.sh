#!/bin/bash

set -ex

# fix accessibility of files
chmod 777 /home/ctf/frontend/src/constants/token-list.json
mkdir -p /home/ctf/frontend/public/connection-info/ && \
ln -s /tmp/$TEAM_UUID /home/ctf/frontend/public/connection-info/$TEAM_UUID

for f in /startup/*; do
    echo "[+] running $f"
    bash "$f"
done

tail -f /var/log/ctf/*
