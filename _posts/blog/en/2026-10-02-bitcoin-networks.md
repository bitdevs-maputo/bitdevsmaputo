---
layout: post
published: true
date: 2026-10-02
title: "Mainnet, Testnet, Signet, and Regtest: The Bitcoin Network Landscape"
description: "A practical guide to Bitcoin networks: understand the differences, purposes, and features of Mainnet, Testnet, Signet, and Regtest."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/bitcoin-networks
---
## Mainnet, Testnet, Signet, and Regtest: The Bitcoin Network Landscape

by Rafael Santos

Updated on: July 22, 2025 · 30 min read

As soon as we begin experimenting with Bitcoin development, we encounter an interesting fact: there are multiple Bitcoin networks. Strictly speaking, there is only one real Bitcoin network, right? But you don't "play around" with real money on the live Bitcoin network. Therefore, to develop and test software safely, we have several auxiliary test and development networks. This article aims to explain the differences, purposes, and features of each network.

First, it is important to understand why these auxiliary networks exist. Operating on Bitcoin's main network demands tremendous responsibility, rigorous security, guarantees, and caution. To foster adoption, ensure stability, and maintain software safely, testing, upgrades, and innovations must occur in environments that do not jeopardize the main network. If experiments were run on the main network, any bug or unintended behavior could impact a trillion-dollar ecosystem, leading to financial loss and damaging confidence in the network.

In addition to the main network (Mainnet), there are three others: Testnet, Signet, and Regtest. The primary goals of these alternative networks include:

**Testing New Features and Functionality**

They allow developers to test upgrades, improvements, and bug fixes without putting real money at risk.

**Learning and Training**

Users and developers can practice, build applications and wallets, construct transactions, and study development within the ecosystem without fear of financial loss. That is exactly what we are doing in this article series.

**Simulating Diverse Scenarios**

They simplify creating environments to simulate chain splits, network reorganizations, adversarial attacks, or extreme conditions without affecting Mainnet.

**Application Development and Integration**

They ensure that services, applications, and third-party integrations can be thoroughly tested before public production release.

**Test Automation and Local Development**

Networks like Regtest make it possible to run isolated private networks for automated test suites and detailed debugging without depending on an external infrastructure of peers distributed around the globe.

# Overview of Bitcoin Networks

Bitcoin Core supports 4 official networks that can be configured. Each has a specific purpose and distinct characteristics:

- **Mainnet:**
    
    The primary Bitcoin production network. Real transactions, real financial value, and maximum security. Everything that occurs on Mainnet is final and irreversible.
    
- **Testnet:**
    
    The public test network. Ideal for learning, development, and integration testing. Coins hold no monetary value and can be obtained for free from faucets (explained below).
    
- **Signet:**
    
    A modern test network featuring centralized block generation signed by designated authorities. It provides a stable, predictable environment for testing updates and soft forks. It is the closest test environment to Mainnet in terms of software behavior, frequently used for evaluating proposed protocol changes.
    
- **Regtest:**
    
    A private/local regression testing network initialized by the developer. It grants full, instantaneous control over block generation, making it ideal for unit testing, rapid prototyping, and offline experimentation.

Below is a comparison table across the 4 networks:

| Network | Primary Use Case | Coin Value | Faucet Available | Default Port | Financial Risk | Block Control |
| --- | --- | --- | --- | --- | --- | --- |
| **Mainnet** | Real transactions | Real | No | 8333 | Very High | Decentralized |
| **Testnet** | Public testing | None | Yes | 18333 | None | Decentralized |
| **Signet** | Protocol testing | None | Yes | 38333 | None | Centralized (admin) |
| **Regtest** | Local/private testing | None | No | 18444 | None | User (fully) |

Below, we will explore how to run each of the 4 networks, testing basic example scripts. But first, let's understand how to select and define which network Bitcoin Core will use. There are two ways to choose a network: either via a command-line parameter when invoking bitcoind/bitcoin-cli, or via the configuration file.

First, using command-line arguments:

```bash
# To run on Mainnet (simply omit the parameter):
bitcoind -daemon
bitcoin-cli ...
```

```bash
# To run on Testnet:
bitcoind -testnet -daemon
bitcoin-cli -testnet ...
```

```bash
# To run on Signet:
bitcoind -signet -daemon
bitcoin-cli -signet ...
```

```bash
# To run on Regtest:
bitcoind -regtest -daemon
bitcoin-cli -regtest ...
```

Another way to define the network is through the **bitcoin.conf** configuration file. Simply add a line setting the variable representing the network to 1:

```bash
testnet=1
```

```bash
signet=1
```

```bash
regtest=1
```

Do not specify more than one of these lines at the same time, because Bitcoin Core only supports one active network per instance. If none of these lines are set in **bitcoin.conf** and no command-line parameter is passed, the network that will run is **Mainnet**.

Let's now examine each network in detail.

---

## Mainnet

The Bitcoin Production Network

**Mainnet** is the primary Bitcoin network, where transactions carry real and irreversible economic value. It is where the protocol operates in production, governed by strict consensus rules, broad decentralization, and security backed by thousands of nodes and miners worldwide. Any operation performed on Mainnet involves genuine bitcoins and therefore demands caution. It is the definitive environment for production use.

To run bitcoind on **Mainnet**, we can create a directory and a bitcoin.conf file inside it as follows:

```bash
# bitcoin.conf for Mainnet
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
prune=2000
```

In this configuration file, we have the settings for RPC communication and **prune** (we do not need to understand **fallbackfee** right now). The **prune** variable allows setting a maximum target size (in megabytes) for storing the blockchain. Currently, in July 2025, the Bitcoin blockchain contains around 906,000 blocks, with an estimated size of approximately 675 gigabytes. This requires a significant amount of storage space. Therefore, we can "prune" the structure, retaining only a portion of it. Setting **prune=2000** specifies that we will store only the most recent 2 GB of the blockchain. This does **not** mean that when bitcoind starts, the program does not have to verify all blocks from the very beginning.

We can now start bitcoind on Mainnet:

```bash
bitcoind -datadir="." -daemon
```

Where **-datadir="."** indicates the folder where bitcoin.conf is located and where data will be stored. Upon starting, bitcoind creates the Node and begins a synchronization phase starting from the genesis block. This phase can take a long time (even several days). We can run a script to check the synchronization progress:

```bash
DATADIR="."
while true; do
  clear
  INFO=$(bitcoin-cli -datadir="$DATADIR" getblockchaininfo)
  
  BLOCKS=$(jq '.blocks' <<< "$INFO")
  HEADERS=$(jq '.headers' <<< "$INFO")
  VERIF_PROGRESS=$(jq '.verificationprogress' <<< "$INFO")

  PERCENT_BLOCOS=$(echo "scale=2; 100 * $BLOCKS / $HEADERS" | bc)
  PERCENT_VERIF=$(echo "scale=4; 100 * $VERIF_PROGRESS" | bc)

  echo "Updated at: $(date)"
  echo "Blocks verified: $BLOCKS / $HEADERS (${PERCENT_BLOCOS}%)"
  echo "Verification progress (computational weight): ${PERCENT_VERIF}%"

  sleep 30
done
```

In this script, every 30 seconds updates will be displayed, such as date and time, number of verified blocks, and estimated true verification percentage. Data is obtained via a call to bitcoin-cli with the **getblockchaininfo** command. The output of the **bitcoin-cli getblockchaininfo** command is structured in JSON format. To extract specific fields from this output, we use the jq utility, a command-line tool designed for **processing JSON data**. Finally, the script computes the percentages and displays them on the screen. This true verification progress shown at the end differs from the raw block percentage because recent blocks are far more computationally intensive to verify than older ones. Below is the script output:

```bash
# Mainnet
Updated at: Mon Jul 21 2025 18:02:02 -03
Blocks verified: 366570 / 906578 (40.43%)
Verification progress (computational weight): 6.3458810675100800%
```

Notice that in this example, 40% of the blocks had already been verified, yet only 6.34% of the total estimated verification was completed.

It is worth noting that beyond space for storing the blockchain (which can be pruned), we must also have sufficient space to store the UTXO set. At this date, the estimated size of the UTXO set is 11 gigabytes.

Regarding the different types of Bitcoin addresses, we can verify them using the **getnewaddress** command with appropriate parameters. The script below generates all 4 address types on the Bitcoin network:

```bash
# generate_addresses.sh – Creates or loads a wallet and generates addresses of different types

DATADIR="."          # Change to correct path if necessary
WALLET="walletdemo"

echo "Checking wallet '$WALLET'..."

WALLETS_LOADED=$(bitcoin-cli -datadir="$DATADIR" listwallets | jq -r '.[]')

if [[ ! " $WALLETS_LOADED " =~ " $WALLET " ]]; then
  echo "Wallet not loaded. Checking existence on disk..."
  if [ -d "$DATADIR/wallets/$WALLET" ]; then
    echo "Wallet exists. Loading..."
    bitcoin-cli -datadir="$DATADIR" loadwallet "$WALLET"
  else
    echo "Creating new wallet named '$WALLET'..."
    bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET"
  fi
else
  echo "Wallet '$WALLET' already loaded."
fi

echo
echo "Generating addresses..."

LEGACY=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "legacy" legacy)
P2SH=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "p2sh" p2sh-segwit)
BECH32=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "bech32" bech32)
TAPROOT=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "taproot" bech32m)

echo "P2PKH Address (Legacy): $LEGACY"
echo "P2SH-SegWit Address: $P2SH"
echo "Bech32 Address (P2WPKH): $BECH32"
echo "Taproot Address (Bech32m): $TAPROOT"

echo
echo "Script completed successfully."
```

The output of running the script is:

```bash
Generating addresses...
P2PKH Address (Legacy): 1BPQUbbYAEbKLRQWEzgFxpewbWA7guGjTz
P2SH-SegWit Address: 3JoSXxDegiVLXWNbk3S2ysKH3rUtK88fuv
Bech32 Address (P2WPKH): bc1qpkfvw8meyx8gkk8ntrk0g2sumas3k8w36g53k8
Taproot Address (Bech32m): bc1pu8zndzsjcmssg43wf3dusjjhe930x3ckuslganz9xmsz65h26njqcznxhd

Script completed successfully.
```

To complete our basic understanding of **Mainnet**, we can run a simple test script, even while synchronization is still taking place:

```bash
echo "Most recent available blocks"
echo "Updated at: $(date -R)"
echo

FIM=$(bitcoin-cli -datadir="." getblockcount)
INICIO=$((FIM - 5))

for i in $(seq $INICIO $FIM); do
  hash=$(bitcoin-cli -datadir="." getblockhash $i 2>/dev/null)
  if [ -n "$hash" ]; then
    header=$(bitcoin-cli -datadir="." getblockheader "$hash" 2>/dev/null)

    timestamp=$(echo "$header" | jq -r '.time')
    data_formatada=$(date -d @"$timestamp" '+%Y-%m-%d %H:%M:%S' 2>/dev/null)
    nTx=$(echo "$header" | jq '.nTx')
    
    echo "Block #$i"
    echo "Hash: $hash"
    echo "Date/time: $data_formatada"
    echo "Number of transactions: $nTx"
    echo "----------------------------------------"
  else
    echo "Block #$i not yet available (syncing or pruned)"
    echo "----------------------------------------"
  fi
done
```

With this script we can inspect information about the last 5 synchronized blocks. The script uses commands like **getblockcount**, **getblockhash**, and **getblockheader**, along with **jq** to manipulate the JSON response. We can see the block number and hash, creation date/time, and the total number of transactions included in that block, as shown below:

```bash
Block #493907
Hash: 0000000000000000003fca57ad038476db43da96587aea3e8e17c38496456086
Date/time: 2017-11-10 10:21:04
Number of transactions: 1823
```

---

## Testnet

The Traditional Bitcoin Test Network

**Testnet** is one of Bitcoin's primary test networks, created to allow developers and enthusiasts to experiment with network functionality without financial risk. On this network, bitcoins have no real value and can be obtained for free from **faucets**, making it ideal for testing transactions, scripts, and applications in a decentralized environment. Unlike **Signet**, which has coordinated and more predictable mining, Testnet is open to public mining, which can result in greater instability, such as frequent orphaned blocks or variations in confirmation times. Despite this, because it is open and close to Mainnet in terms of operation, it is a valuable tool for experimentation and testing.

To run bitcoind on **Testnet**, we can create a directory and a bitcoin.conf file inside it as follows:

```bash
# bitcoin.conf for Testnet
testnet=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
prune=2000
```

Notice that we can also "prune" the blockchain (**prune=2000**). Currently, in July 2025, the Bitcoin Testnet blockchain contains about **4.5 million** blocks, with an estimated size of approximately **170 gigabytes**.

We can now start bitcoind on Testnet:

```bash
bitcoind -datadir="." -daemon
```

As long as **datadir** reflects the folder where bitcoin.conf is located, we do not need to use the **-testnet** parameter. In the same way, as soon as the Node starts, block synchronization begins. It is worth noting that there is a pre-synchronization phase, even before beginning to validate blocks, which can also take time. We can check this pre-synchronization by checking the logs:

```bash
tail -n 5 testnet3/debug.log
2025-07-22T14:08:14Z Pre-synchronizing blockheaders, height: 1222000 (~75.07%)
2025-07-22T14:08:15Z Pre-synchronizing blockheaders, height: 1224000 (~75.10%)
2025-07-22T14:08:16Z Pre-synchronizing blockheaders, height: 1226000 (~75.16%)
2025-07-22T14:08:20Z Pre-synchronizing blockheaders, height: 1228000 (~75.21%)
2025-07-22T14:08:22Z Pre-synchronizing blockheaders, height: 1230000 (~75.25%)
```

In this case, 75% of pre-synchronization was complete. Afterward, we can run that same script from Mainnet to check synchronization progress:

```bash
# Testnet
Updated at: Tue Jul 22 2025 14:18:18 -03
Blocks verified: 1164276 / 4578642 (25.42%)
Verification progress (computational weight): 2.15911228641810500%
```

At that moment in the example, we had about 25% of blocks verified, representing 2.15% of the estimated total. After synchronization finishes, we can run the example script below to create a wallet, associate an address with it, receive **tBTC** via a **faucet** (sites that provide tBTC), check the wallet balance, and view recent transactions.

```bash
# script_testnet.sh – Generates address, requests BTC from faucet, and waits for confirmed balance

DATADIR="."  # adjust if needed
WALLET="testwallet"

echo "Checking if wallet is loaded..."

WALLETS_LOADED=$(bitcoin-cli -datadir="$DATADIR" listwallets | jq -r '.[]')

if [[ ! " $WALLETS_LOADED " =~ " $WALLET " ]]; then
  echo "Wallet '$WALLET' is not loaded. Checking if it exists..."
  if [ -d "$DATADIR/wallets/$WALLET" ]; then
    echo "Wallet exists on disk. Loading..."
    bitcoin-cli -datadir="$DATADIR" loadwallet "$WALLET"
  else
    echo "Wallet does not exist. Creating new wallet named '$WALLET'..."
    bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET"
  fi
else
  echo "Wallet '$WALLET' is already loaded."
fi

echo
echo "Generating new Testnet address..."
ADDR=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "" bech32)
echo "Generated address: $ADDR"

echo
echo "Visit the Testnet faucet and send BTC to this address:"
echo "https://coinfaucet.eu/en/btc-testnet/"
echo

read -p "Press ENTER to start balance monitoring..."

echo "Waiting for balance... (may take a few minutes while transaction is mined)"
SECONDS=0

while true; do
  BAL=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getreceivedbyaddress "$ADDR")
  if (( $(echo "$BAL > 0" | bc -l) )); then
    echo "Balance received: $BAL BTC"
    break
  fi
  echo "Still no balance... elapsed time: ${SECONDS}s"
  sleep 30
done

echo
echo "Checking wallet balance..."
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getbalance

echo
echo "Listing recent transactions..."
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" listtransactions "*" 5
```

We can generate the different address types on Testnet as well, running that same script:

```bash
Generating addresses...
P2PKH Address (Legacy): n4QBcuAakTB75aG4YMkEiRb5rZV5AJUZT4
P2SH-SegWit Address: 2NFHUn3gXrHZzb4ivGDCaLU2mjEwZbWhDqJ
Bech32 Address (P2WPKH): tb1q49sjj4yp5ymvhl9lje57rqlgg4z72fc5q4lnqm
Taproot Address (Bech32m): tb1pwjksv0mmgspyelk97ncq2skhjeph2620n6gsj42z6cps9ww26nvsype89r

Script completed successfully.
```

---

## Signet

Bitcoin Test Network with Coordinated Mining

**Signet** is a Bitcoin test network created to offer a more stable, predictable, and controlled environment than traditional Testnet. Its main difference is the use of **blocks signed by authorized entities**, which prevents unpredictable fluctuations in mining, such as those that occur on public Testnet. Therefore, Signet is ideal for tests that require reliable synchronization, rapid confirmations, and greater predictability. Although it shares the same address types as Testnet (such as **tb1q**... and **tb1p**...), Signet operates in a more coordinated manner, facilitating development, automated testing, and technical demonstrations without the uncertainties of an open network.

To run bitcoind on **Signet**, we can create a directory and a bitcoin.conf file inside it as follows:

```bash
signet=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
```

Currently, in July 2025, the Bitcoin Signet blockchain contains about **261,000** blocks, with an estimated size of approximately 25 **gigabytes**.

We can then start bitcoind on Signet:

```bash
bitcoind -datadir="." -daemon
```

Block synchronization begins. There is also a pre-synchronization phase on Signet, although it is much faster. Afterward, we can verify synchronization by running that same script:

```bash
# Signet
Updated at: Tue Jul 22 2025 21:13:42 -03
Blocks verified: 203332 / 261788 (77.67%)
Verification progress (computational weight): 17.8348096923163800%
```

We can generate the different address types on **Signet** as well, running that same script:

```bash
Generating addresses...
P2PKH Address (Legacy): mxTudpK1Hqtu93v9Qcotn2CVDtiZWPwbcY
P2SH-SegWit Address: 2NAG6g1DcwcMnmH3WEakKbAYZGj9w66aXUi
Bech32 Address (P2WPKH): tb1q36znl86c8ctw5j38rcjt3gev50g5a0pl4yjlwf
Taproot Address (Bech32m): tb1pw03u6y8772ysdwa6mr78ms8kuupfgruz0qz97z6z5vnqflzxxxpse6zqax

Script completed successfully.
```

Finally, we can run an example script:

```bash
WALLET="signetwallet"
DATADIR="."

echo "Checking wallet '$WALLET'..."
if ! bitcoin-cli -datadir="$DATADIR" listwallets | grep -q "$WALLET"; then
  if [ -d "$DATADIR/wallets/$WALLET" ]; then
    echo "Wallet exists. Loading..."
    bitcoin-cli -datadir="$DATADIR" loadwallet "$WALLET" >/dev/null
  else
    echo "Creating new wallet named '$WALLET'..."
    bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET" >/dev/null
  fi
else
  echo "Wallet '$WALLET' is already loaded."
fi

echo
echo "Generating destination address..."
ADDR=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress)
echo "Generated address: $ADDR"
echo
echo "Use a Signet faucet to send BTC to this address:"
echo "https://signet.dcorral.com/"
echo "https://signetfaucet.com/"
echo "https://faucet.signet.bc-2.jp/"
echo

SECONDS=0
while true; do
  UTXOS=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" listunspent 1 9999999 "[\"$ADDR\"]")
  COUNT=$(echo "$UTXOS" | jq 'length')
  if [ "$COUNT" -gt 0 ]; then
    echo "UTXO received after ${SECONDS}s:"
    echo "$UTXOS" | jq
    break
  fi
  echo "Waiting for UTXO... elapsed time: ${SECONDS}s"
  echo "Address: $ADDR"
  sleep 15
done
```

The script creates/loads a wallet, generates an address, waits to receive **sBTC** through a **faucet**, and lists the **UTXOs** of transactions belonging to the **address** inside the **loaded wallet**.

---

## Regtest

The Local Bitcoin Test Network

The **Regtest** network is a private, controlled Bitcoin test environment run entirely locally. Its primary purpose is to enable rapid, safe, and cost-free experimentation, as blocks can be mined instantly with a simple command. Unlike other networks, there is no connection to external peers and no need to wait for real confirmations, making it ideal for automated tests, script development, and real-time functionality validation.

To run bitcoind on **Regtest**, simply create a folder with the bitcoin.conf file inside:

```bash
regtest=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
```

Unlike other networks, Regtest does not require a significant synchronization phase, since it is a local network created from scratch, containing only the genesis block until new blocks are mined manually.

We can now start bitcoind on Regtest:

```bash
bitcoind -datadir="." -daemon
```

When running the synchronization script, we see verified blocks at zero (since none exist yet) and total verification complete:

```bash
Updated at: Tue Jul 22 2025 23:01:24 -03
Blocks verified: 0 / 0 (%)
Verification progress (computational weight): 100%
```

We can generate the different address types on **Regtest** as well, running that same script:

```bash
Generating addresses...
P2PKH Address (Legacy): mvdHhLqBJDUK3xiM52Q93DFZGdUQyKrZb7
P2SH-SegWit Address: 2NDkztMtZQLeufi7JfUVdFaUEifZSLsTCGw
Bech32 Address (P2WPKH): bcrt1q0qzzk72lpuecraxflkeq6x60c2r4jgvtkngmm7
Taproot Address (Bech32m): bcrt1pecx9u8segeaey68vwayk8cfspuydqfzp24es5z68jtjkd78gmdwszyll0s

Script completed successfully.
```

To conclude, we can create a script for **Regtest** that creates 2 addresses, mines blocks, and transfers BTC:

```bash
# script_regtest.sh – Creates address, mines blocks, and transfers BTC on Regtest

DATADIR="."  # or define path if outside current folder
WALLET="regwallet"
# 1. Create or load the wallet
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getwalletinfo 2>/dev/null || \
bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET"
# 2. Generate two addresses
ADDR_FROM=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "sender" bech32)
ADDR_TO=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "recipient" bech32)
echo "Sender address: $ADDR_FROM"
echo "Recipient address: $ADDR_TO"
# 3. Mine 101 blocks to obtain balance (50 BTC per block)
echo "Mining blocks to generate balance..."
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" generatetoaddress 101 "$ADDR_FROM"
# 4. Transfer BTC
echo "Sending 1 BTC from sender to recipient..."
TXID=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" sendtoaddress "$ADDR_TO" 1.0)
# 5. Mine 1 block to confirm the transaction
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" generatetoaddress 1 "$ADDR_FROM"
# 6. Show final balance
SALDO=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getreceivedbyaddress "$ADDR_TO")
echo "Recipient final balance: ${SALDO} BTC"
```

And the output is:

```bash
Sender address: bcrt1qtmecvrrdngju2zdud6q4875fk2rd9cl3sarwaw
Recipient address: bcrt1qmyk5tjvz68rzzsms7m3muacd96jf764eh7s9m8
Mining blocks to generate balance...
[
  "3cbcdcc757413824714404e65478da5071450afdd4580127f98ca949853cd35e",
  ......,
  "676e764539b902dcbff86b2a7965c7fee808471d23e80d2fa1c97703d584ace1"
]
Sending 1 BTC from sender to recipient...
[
  "6f9b2e9a22ea62d41eb5e852d1eafd5611a6737c666d30fac3c64bf7369e65dd"
]
Recipient final balance: 1.00000000 BTC
```

---

Exploring Bitcoin's different networks in practice allows us to understand more clearly how nodes function, how scripts interact with the blockchain, and which tools are available in each environment. By switching between Mainnet, Testnet, Signet, and Regtest, you can develop, test, and validate operations safely and with full control. From here, the next step is to build your own tools, simulations, and automations on these networks.

