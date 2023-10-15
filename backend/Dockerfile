FROM gcr.io/paradigmxyz/ctf/base:latest

# setup foundry and deploy contracts
RUN true \
    && curl -L https://foundry.paradigm.xyz | bash \
    && bash -c "source /root/.bashrc && foundryup" \
    && chmod 755 -R /root \
    && true
 
COPY ./contracts/ /tmp/contracts/

RUN true \
    && cd /tmp/contracts \
    && /root/.foundry/bin/forge build --out /home/ctf/compiled \
    && rm -rf /tmp/contracts \
    && true

# setup and deploy challenge handler
ENV HTTP_PORT=1337
ENV PYTHONPATH /usr/lib/python

COPY chall_handler/requirements.txt /root
RUN python3 -m pip install -r /root/requirements.txt 

COPY chall_handler/eth_sandbox/ /usr/lib/python/eth_sandbox/
COPY chall_handler/chal.py /home/ctf/chal.py
