---
layout: post
published: true
date: 2026-09-30
title: "Bitcoin Node with Bitcoin Core: Installation, bitcoind, and bitcoin-cli"
description: "Getting started with Bitcoin Core: what is a Bitcoin node, node types, Ubuntu installation, and essential bitcoind and bitcoin-cli commands."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/bitcoin-node
---
## Bitcoin Node with Bitcoin Core: Installation, bitcoind, and bitcoin-cli (Getting Started)

by Rafael Santos

This is the first in a series of articles I am writing about Bitcoin from a technical perspective. An important detail to keep in mind is that Bitcoin is a protocol—that is, a set of rules to be followed. These rules are adhered to by various entities that communicate with each other to form a network.

Each of these entities participating in the network can be viewed as a Node. In short, a Node is **software running on an electronic device** (such as a computer) whose primary role is to **enforce the rules of the Bitcoin protocol**.

A Node can operate in several ways:

- Receiving blocks and transactions;
- Independently validating blocks and transactions;
- Relaying and broadcasting blocks and transactions to other Nodes;
- Maintaining a copy of the blockchain;
- Mining;
- Providing APIs for developers, applications, and services.

We can classify Nodes into 3 types (although other classifications exist):

**Full Node**

- Downloads the **entire blockchain** and **validates all rules** of Bitcoin (such as block sizes, signature rules, total satoshi supply, etc.).
- Uses the complete protocol implementation.
- Full autonomy: trusts no third parties.
- Contributes to the network by relaying transactions and blocks.

**Light Node (SPV – Simplified Payment Verification)**

- Does not download the entire blockchain, only **block headers**.
- Verifies transactions via **proof of inclusion** (Merkle Tree).
- Relies on a full node as an intermediary to access data.
- Lightweight, ideal for mobile devices.
- **Lower privacy and trust assumptions**.

**Mining Node (Miner Node)**

- A full node equipped with additional mining software.
- Validates blocks and attempts to find a hash that satisfies the current target difficulty (Proof-of-Work).
- Propagates newly discovered blocks across the network.

# Installation and Configuration

Bitcoin Core

Any software that implements the protocol rules can participate in the Bitcoin network. Bitcoin Core is the oldest implementation and considered the primary reference, as it originated in 2009 with Satoshi Nakamoto. Since then, it has undergone numerous upgrades contributed by many developers who joined the open-source effort. Its development process, being truly decentralized, is unique; however, that is beyond the scope of this article.

Installing and configuring Bitcoin Core is straightforward. For the examples in this article, we will use Ubuntu 22.04.5 LTS. Below is a step-by-step guide:

```bash
# Download and install Bitcoin Core
https://bitcoincore.org/en/download/
https://bitcoincore.org/bin/bitcoin-core-29.0/bitcoin-29.0-x86_64-linux-gnu.tar.gz

# Extract and move to /opt:
tar -xvf bitcoin-29.0-x86_64-linux-gnu.tar.gz
sudo mv bitcoin-29.0 /opt/bitcoin

# Add executable to PATH (optional):
gedit ~/.bashrc
# Add to the end of the file:
export PATH="/opt/bitcoin/bitcoin-29.0/bin:$PATH"
# Reload:
source ~/.bashrc

# Verify the installation:
bitcoind --version
bitcoin-cli --version
```

Notice that we verified the installation of two programs: **bitcoind** and **bitcoin-cli**. Both are part of Bitcoin Core, but serve different purposes:

- **bitcoind** is the primary service, known as a daemon. It is what actually runs the Node. It typically runs in the background, validating transactions and blocks, maintaining the blockchain, relaying data to peers, and more.
- **bitcoin-cli** is the command-line client. It communicates with bitcoind via Remote Procedure Call (RPC) commands. Examples of supported operations include checking wallet balances, sending bitcoin, creating transactions, and inspecting network state.

The **bitcoin.conf** file is the main configuration file for Bitcoin Core. In it, we can define crucial parameters such as the network mode (mainnet, testnet, or regtest), RPC credentials, IP access permissions, fees, and other runtime parameters. Below is an example:

```bash
# bitcoin.conf
regtest=1
rpcuser=usuario
rpcpassword=senha123
txindex=1
rpcallowip=127.0.0.1
fallbackfee=0.0001
```

We can now start running **bitcoind**:

```bash
# Create a data directory for the Node
mkdir -p /home/user/bitcoin-regtest-node1

# Edit the Node's configuration file
gedit /home/user/bitcoin-regtest-node1/bitcoin.conf
regtest=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
[regtest]
rpcport=18443
port=18444

# Start the Node
bitcoind -datadir=/home/user/bitcoin-regtest-node1 -daemon

# Stop the Node
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 stop
```

# Running bitcoind

Let's break down some of the settings defined in the **bitcoin.conf** file. We can configure which network the Node will operate on.

**Operating Modes**

- **mainnet**: The live, production network (transactions involve real money).
- **testnet**: Public test network.
- **signet**: Public test network.
- **regtest**: Local regression test network controlled by the developer (ideal for experimentation).

To select a network, simply set the corresponding variable to 1. In our tests, we will generally use the local regression test network, which runs only on our own computer (regtest=1).

**Remote Procedure Call (RPC)**

Bitcoin Core provides an **RPC API** (Remote Procedure Call) that allows developers to interact with the Node. This interface exposes commands to query balances, broadcast transactions, mine blocks (in regtest), check network status, and more. The RPC interface communicates via authenticated HTTP requests and returns JSON responses. As a result, developers can integrate the Bitcoin Node with scripts, web applications, wallets, block explorers, and many other systems. Let's look at the RPC settings in bitcoin.conf:

- **rpcuser=teste**: Defines a username to access the API calls.
- **rpcpassword=teste**: Defines a password to access the API calls.
- **rpcallowip=127.0.0.1**: Restricts RPC access strictly to the local machine.

In addition to these settings, there is a dedicated section for **regtest mode**:

- **[regtest]**: Indicates that the parameters below apply only when the Node is running in regtest mode.
- **rpcport=18443**: Defines the port bitcoind will use to accept RPC connections.
- **port=18444**: Defines the peer-to-peer network port (the port bitcoind uses to connect to other nodes, receive connections from other nodes, and relay valid blocks and transactions).

**Once bitcoind is running, the Node:**

- Starts **connecting** to other Nodes on the network (via the P2P protocol);
- Begins **receiving**, **verifying**, and **propagating** transactions and blocks;
- Maintains and updates a local copy of the **blockchain** (if operating as a full node);
- Exposes the **RPC API**, allowing commands to be issued through **bitcoin-cli** or other clients.

We can run a series of tests to understand how the running Node operates. To do this, we will use **bitcoin-cli**. Let's start with the blockchain:

```bash
bitcoin-cli -regtest -datadir=/home/user/bitcoin-regtest-node1 getblockchaininfo

{
  "chain": "regtest",
  "blocks": 0,
  "headers": 0,
  "bestblockhash": "0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206",
  "bits": "207fffff",
  "target": "7fffff0000000000000000000000000000000000000000000000000000000000",
  "difficulty": 4.656542373906925e-10,
  "time": 1296688602,
  "mediantime": 1296688602,
  "verificationprogress": 1,
  "initialblockdownload": true,
  "chainwork": "0000000000000000000000000000000000000000000000000000000000000002",
  "size_on_disk": 293,
  "pruned": false,
  "warnings": [
  ]
}
```

We see that the Node already has the blockchain structure loaded, even without any blocks yet (apart from the genesis block). We can also check connections to other Nodes:

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 getpeerinfo

[ 
]
```

At this initial moment, only this Node exists, so there are no connections to other Nodes on the network. We can create a wallet associated with the Node:

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 createwallet "NovaCarteira"

{
  "name": "NovaCarteira"
}
```

We then generate a new address for this wallet:

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 -rpcwallet=NovaCarteira getnewaddress

bcrt1q5wa3jgkuqvut2rayz0kj77j7lzg5609rmhqw3a
```

We request the creation of a new block (mining in regtest) and can observe the Node generating and validating the block (use your own address created in the command above):

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 generatetoaddress 1 bcrt1q5wa3jgkuqvut2rayz0kj77j7lzg5609rmhqw3a

[
"3a75f53d88efdf652fcbcd8ceec51413cca488163641fe5eba6e38a5ce937fc7"
]

bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 getblockcount

1
```

The **generatetoaddress** command in this example mines 1 block and sends the block reward (50 BTC) to the specified address (the one we created in the previous step). Then, the **getblockcount** command confirms that the blockchain now contains 1 block. We can also view transactions validated and associated with the Node:

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 listtransactions

[
  {
    "address": "bcrt1q5wa3jgkuqvut2rayz0kj77j7lzg5609rmhqw3a",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4YiDDQ216BaJirHX5JYaKFTytSSDo9HL4jpc5y4iSRiKs4hYpugz669CCytpd3epKmgg169KfrfUGpgeA1WywNUqUpeuNwxj/84h/1h/0h/0/*)#sjlzentj"
    ],
    "category": "immature",
    "amount": 50.00000000,
    "label": "",
    "vout": 0,
    "abandoned": false,
    "confirmations": 1,
    "generated": true,
    "blockhash": "3a75f53d88efdf652fcbcd8ceec51413cca488163641fe5eba6e38a5ce937fc7",
    "blockheight": 1,
    "blockindex": 0,
    "blocktime": 1750012465,
    "txid": "1434fd00768a896b5bf3d2b6015b21cb20edff129512b82d1552775c6b88221b",
    "wtxid": "1ce6c144dc2641c84fcd99f4204b261317a28c6bb8a94c84e3afda1416246c06",
    "walletconflicts": [
    ],
    "mempoolconflicts": [
    ],
    "time": 1750012465,
    "timereceived": 1750012465,
    "bip125-replaceable": "no"
  }
]
```

Through these tests, we can see that as soon as **bitcoind** is started, the Node is already functional. It begins validating blocks and transactions, connecting to other Nodes, and more. It also exposes the RPC API and responds to commands immediately. Below are several other **bitcoin-cli** commands. To list all commands, run:

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 help
```

**bitcoin-cli (Command Line)**

The **bitcoin-cli** tool sends RPC commands to your node. It is the most practical and secure way to interact with a local Node. Here are some other examples of commands that can be issued:

```bash
# Network status and peer connections
bitcoin-cli -datadir=/home/user1/bitcoin-regtest-node1 getnetworkinfo

# Show wallet balance
bitcoin-cli -datadir=/home/user1/bitcoin-regtest-node1 -rpcwallet=NovaCarteira getbalance

# Return the block hash at height 0 (genesis block)
bitcoin-cli -datadir=/home/user1/bitcoin-regtest-node1 getblockhash 0

# Show detailed block information (by hash)
bitcoin-cli -datadir=/home/user1/bitcoin-regtest-node1 getblock <block_hash>

# List wallet UTXOs (unspent transaction outputs)
bitcoin-cli -datadir=/home/user1/bitcoin-regtest-node1 -rpcwallet=NovaCarteira listunspent
```

Throughout the upcoming articles, we will use various bitcoin-cli commands to interact with the Node. It is also worth noting that you can interact directly with the Node using tools like curl by making HTTP requests:

```bash
curl --user teste:teste \
  --data-binary '{"jsonrpc":"1.0","id":"exemplo","method":"getblockcount","params":[]}' \
  -H 'content-type:text/plain;' http://127.0.0.1:18443/
```

It is also important to understand that options configured in **bitcoin.conf** can alternatively be specified through command-line arguments to **bitcoin-cli** and **bitcoind**:

```bash
bitcoin-cli -regtest -rpcport=18443 -datadir=/home/user1/bitcoin-regtest-node1 getblockhash 0
```

To conclude this article, we will walk through a more comprehensive example. In this test, we will simulate communication between two Bitcoin Nodes running in regtest mode. The idea is to demonstrate, in practice, that Nodes connect, synchronize blocks, and propagate transactions. We will also create wallets, mine blocks, generate a balance, and send a transaction from one Node to another, observing its presence in the mempool before confirmation. Below are the steps we will perform:

```bash
# Advanced Example

1. Create two separate data directories for the two nodes (node1 and node2);

2. Configure the bitcoin.conf file for each node, defining ports and credentials;

3. Start both nodes (bitcoind) in regtest mode;

4. Manually connect the two nodes;

5. Verify that the nodes are actually connected;

6. Create a wallet on each Node;

7. Generate addresses;

8. Mine 101 blocks on Node 1 to release spendable balance;

9. Send 1 BTC from Node 1 to Node 2;

10. Verify the pending transaction on Node 2;

11. Query the mempool of both Nodes to confirm that the transaction was propagated;

12. Mine one more block on Node 1 to confirm the transaction;

13. Confirm that the transaction was included in the block.
```

## Step 1 - Create Separate Data Directories for the Two Nodes

```bash
mkdir -p /home/user/bitcoin-regtest-node1
mkdir -p /home/user/bitcoin-regtest-node2
```

## Step 2 - Configure the bitcoin.conf File for Each Node

```bash
# Create file /home/user/bitcoin-regtest-node1/bitcoin.conf

regtest=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
[regtest]
rpcport=18443
port=18444
```

```bash
# Create file /home/user/bitcoin-regtest-node2/bitcoin.conf

regtest=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
[regtest]
rpcport=18453
port=18454
```

## Step 3 - Start Both Nodes in Regtest Mode

```bash
bitcoind -regtest -datadir=/home/user/bitcoin-regtest-node1 -daemon
bitcoind -regtest -datadir=/home/user/bitcoin-regtest-node2 -daemon
```

## Step 4 - Connect the Two Nodes

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node2 addnode 127.0.0.1:18444 add
```

## Step 5 - Verify That the Nodes Are Actually Connected

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 getpeerinfo
```

## Step 6 - Create a Wallet on Each Node

```bash
# Node 1
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 createwallet "minerador"

# Node 2
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node2 createwallet "recebedor"
```

## Step 7 - Generate Addresses

```bash
# Node 1
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 -rpcwallet=minerador getnewaddress

# Node 2
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node2 -rpcwallet=recebedor getnewaddress
```

Note down the generated addresses.

## Step 8 - Mine 101 Blocks on Node 1 to Release Spendable Balance

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 -rpcwallet=minerador generatetoaddress 101 <miner_address>
```

Note: Bitcoins generated in the **coinbase** (the first transaction of a block, which creates new bitcoins) can only be spent after 100 confirmations—which is why we mine 101 blocks.

## Step 9 - Send 1 BTC from Node 1 to Node 2

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 -rpcwallet=minerador sendtoaddress <receiver_address> 1
```

## Step 10 - Verify the Pending Transaction on Node 2

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node2 listtransactions
```

The transaction should appear with "confirmations": 0

## Step 11 - Query the Mempool on Both Nodes to Confirm the Transaction Propagated

```bash
# Node 1
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 getrawmempool

# Node 2
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node2 getrawmempool
```

Both should return the same txid (transaction hash).

## Step 12 - Mine One More Block on Node 1 to Confirm the Transaction

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node1 -rpcwallet=minerador generatetoaddress 1 <miner_address>
```

## Step 13 - Confirm That the Transaction Was Included in the Block

```bash
bitcoin-cli -datadir=/home/user/bitcoin-regtest-node2 listtransactions
```

The transaction should now show "confirmations": 1 or more.

In this article, we saw in practice how Bitcoin Nodes work. With examples in regtest, it was possible to observe block propagation, transaction creation, and synchronization between Nodes. Understanding these mechanisms is fundamental for developers who want to dive deeper into the internal workings of Bitcoin and contribute directly to the ecosystem.

Part 2 of this article on Bitcoin Nodes will be published soon, addressing complementary topics that were left out of this first practical introduction. This next part will bring a deeper approach aimed at developers who want to understand the inner workings of Bitcoin Core Nodes. This continuation aims to deepen the understanding of how a Bitcoin Node operates from the inside, revealing the mechanisms that ensure its security, connectivity, and fundamental role in the network.


