---
layout: post
published: true
date: 2026-10-12
title: "Building Transactions in Bitcoin Core"
description: "A hands-on guide to constructing transactions in Bitcoin Core: simple sends, change handling, transaction batching, manual fee control, and raw hex creation."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/building-transactions
---
## Building Transactions in Bitcoin Core

by Rafael Santos

In the previous article, we explored the anatomy of a Bitcoin transaction, understanding how inputs and outputs connect to the UTXO model and how Bitcoin Core can handle different levels of automation, from fully automatic creation to assembling raw transaction hex. That foundation was essential for understanding the protocol's internal logic and seeing how each component of a transaction plays a vital role in network validation.

Now, we take things a step further: the goal of this article is to **learn how to create transactions across different types and scenarios**, putting manual transaction construction with Bitcoin Core into practice. We will start with simple examples and explore real-world situations, such as sending to multiple recipients (batching), creating transactions with change, consolidating UTXOs, and manually controlling fees.

To master transaction creation in Bitcoin Core, it is important to go beyond the simplest case and experiment with different scenarios that reflect real-world usage. Each of these scenarios teaches us something specific about how the protocol works and how we can achieve greater control over our UTXOs and fees.

In this article, we will use the `regtest` network—do not forget to configure your `bitcoin.conf` file. You can also use `signet`, though you will need to wait for sBTC to arrive after requesting from a faucet.

---

## Simple Transactions and the Role of Change

This is the most basic example: spending a single UTXO to send funds to a single recipient. Yet even in a "simple transaction," there are critical nuances to consider. If you do not have any UTXOs, create an address for your wallet and mine 101 blocks (to make coinbase rewards spendable):

```bash
bitcoin-cli -datadir="." getnewaddress
# bcrt1q7nt3cskcna7pshru94t2s6tgfpxqymlkp0eh6p
```

```bash
bitcoin-cli -datadir="." generatetoaddress 101 bcrt1q7nt3cskcna7pshru94t2s6tgfpxqymlkp0eh6p
```

- First, let's list the available UTXOs in the wallet:

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "c3fef1a9764c57262ef70c2f11eb5bf548cbbcaeb7d900a77ae9ac25cb3954de",
    "vout": 0,
    "address": "bcrt1q7nt3cskcna7pshru94t2s6tgfpxqymlkp0eh6p",
    "label": "",
    "scriptPubKey": "0014f4d71c42d89f7c185c7c2d56a86968484c026ff6",
    "amount": 50.00000000,
    "confirmations": 101,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/0]024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba7)#ah5fng3d",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  }
]
```

In this case, we have a UTXO with 50 BTC to spend. Let's look at a few scenarios.

**1. Sending partial funds, letting Core handle change**

Suppose we want to send **0.5 BTC** and let Core calculate the fee and generate a change address.

**a. Create the raw hex without fee or change**

```bash
bitcoin-cli -datadir="." createrawtransaction   '[{"txid":"c3fef1a9764c57262ef70c2f11eb5bf548cbbcaeb7d900a77ae9ac25cb3954de","vout":0}]'   '{"bcrt1qkqp9xzkre29gl7kl7d3s264nstysw7fqjj5pqf":0.5}'
0200000001de5439cb25ace97aa700d9b7aebccb48f55beb112f0cf72e26574c76a9f1fec30000000000fdffffff0180f0fa0200000000160014b002530ac3ca8a8ffadff363056ab382c907792000000000

```

**b. Fund with automatic fee and change**

The hex generated above is passed to the `fundrawtransaction` command, which completes the transaction by adding a fee and a change output.

```bash
bitcoin-cli -datadir="." fundrawtransaction "0200000001de5439cb25ace97aa700d9b7aebccb48f55beb112f0cf72e26574c76a9f1fec30000000000fdffffff0180f0fa0200000000160014b002530ac3ca8a8ffadff363056ab382c907792000000000"  '{"feeRate":0.00001000}'
{
  "hex": "0200000001de5439cb25ace97aa700d9b7aebccb48f55beb112f0cf72e26574c76a9f1fec30000000000fdffffff0280f0fa0200000000160014b002530ac3ca8a8ffadff363056ab382c9077920f3000b2701000000160014fcde2eebcd45d4e852907d8de7051e5a9e9a472700000000",
  "fee": 0.00000141,
  "changepos": 1
}
```

A new hex string is generated, now representing the complete funded transaction.

**c. Sign and send**

```bash
bitcoin-cli -datadir="." signrawtransactionwithwallet "0200000001de5439cb25ace97aa700d9b7aebccb48f55beb112f0cf72e26574c76a9f1fec30000000000fdffffff0280f0fa0200000000160014b002530ac3ca8a8ffadff363056ab382c9077920f3000b2701000000160014fcde2eebcd45d4e852907d8de7051e5a9e9a472700000000"
{
  "hex": "02000000000101de5439cb25ace97aa700d9b7aebccb48f55beb112f0cf72e26574c76a9f1fec30000000000fdffffff0280f0fa0200000000160014b002530ac3ca8a8ffadff363056ab382c9077920f3000b2701000000160014fcde2eebcd45d4e852907d8de7051e5a9e9a4727024730440220139015403f1787b993f84616a737c4a51ac93976cae845e1bc3949a8245a21c702200fa867025026dd8a624896265bf9c44130d87c49845a4251f3917e79a042f87b0121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba700000000",
  "complete": true
}
```

`signrawtransactionwithwallet` signs the transaction, and `sendrawtransaction` broadcasts it to the network.

```bash
bitcoin-cli -datadir="." sendrawtransaction "02000000000101de5439cb25ace97aa700d9b7aebccb48f55beb112f0cf72e26574c76a9f1fec30000000000fdffffff0280f0fa0200000000160014b002530ac3ca8a8ffadff363056ab382c9077920f3000b2701000000160014fcde2eebcd45d4e852907d8de7051e5a9e9a4727024730440220139015403f1787b993f84616a737c4a51ac93976cae845e1bc3949a8245a21c702200fa867025026dd8a624896265bf9c44130d87c49845a4251f3917e79a042f87b0121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba700000000"
1417f599358ea49a63dd253a3b3701ce0fa28cdf006522e4a3c50c48fce12e8e

```

Next, we mine one more block to confirm the broadcast transaction.

```bash
bitcoin-cli -datadir="." generatetoaddress 1 bcrt1q9w437k3luux5crekejss56r8cysxhr4ypuha22
```

Then we can inspect our UTXOs once again.

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "b260fe7dd4eac4dca8b70d58e8cff68fb3f5753a61dc0856e658bbe731736c90",
    "vout": 0,
    "address": "bcrt1q7nt3cskcna7pshru94t2s6tgfpxqymlkp0eh6p",
    "label": "",
    "scriptPubKey": "0014f4d71c42d89f7c185c7c2d56a86968484c026ff6",
    "amount": 50.00000000,
    "confirmations": 101,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/0]024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba7)#ah5fng3d",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
    "txid": "1417f599358ea49a63dd253a3b3701ce0fa28cdf006522e4a3c50c48fce12e8e",
    "vout": 0,
    "address": "bcrt1qkqp9xzkre29gl7kl7d3s264nstysw7fqjj5pqf",
    "label": "",
    "scriptPubKey": "0014b002530ac3ca8a8ffadff363056ab382c9077920",
    "amount": 0.50000000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/1]0238caef26a2025d89d4230bcc7e2d1dbdcc8ce51ce1c07cd4509a76495bba07d9)#8q3llhqf",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
    "txid": "1417f599358ea49a63dd253a3b3701ce0fa28cdf006522e4a3c50c48fce12e8e",
    "vout": 1,
    "address": "bcrt1qln0za67dgh2ws55s0kx7wpg7t20f53e8envezx",
    "scriptPubKey": "0014fcde2eebcd45d4e852907d8de7051e5a9e9a4727",
    "amount": 49.49999859,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/1/0]03f032737bcfe1ccb7cf642458916102c22386727a2e3be2f36cdc4cb6ab37c3b9)#nyyqzwmx",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/1/*)#jtyys78l"
    ],
    "safe": true
  }
]

```

Notice that we now have 3 UTXOs. The first corresponds to the block reward from the mining step we just performed, so we can ignore it here. The second UTXO belongs to the address we sent the transaction to. The third is the change address generated by the transaction, containing `49.49999859 BTC` (the original 50 BTC minus 0.5 BTC sent minus the mining fee).

**2. Spending the entire amount, subtracting the fee automatically**

In this scenario, we want to **send the entire UTXO balance to a single address** without generating a change address.

Bitcoin Core allows the transaction fee to be **deducted directly from the send amount**, so that the final output already accounts for the mining fee.

**a. Create destination address**

```bash
bitcoin-cli -datadir="." getnewaddress
# bcrt1qkyrgk8wkau455lytvggyp5wwtds2rr2m0f5kfg
```

**b. Send full balance, subtracting the fee**
We can use the `sendtoaddress` command with the `subtractfeefromamount=true` parameter to sweep the entire balance of a UTXO:

```bash
bitcoin-cli -datadir="." sendtoaddress \
  bcrt1qkyrgk8wkau455lytvggyp5wwtds2rr2m0f5kfg \
  49.49999859 \
  "" "" \
  true
# 828ec7cedc36f9517bd44a8e2a813be906698125c7c80b9a71a3202f2c09438c
```

- The amount of **49.49999859 BTC** corresponds to the **change UTXO** we received in the previous scenario.
- The final argument `true` deducts the mining fee from this amount, preventing Core from creating a change address.

The command output returns the `txid` of the new transaction.

**c. Confirm in a block**
Next, we mine another block to confirm the transaction.

```bash
bitcoin-cli -datadir="." generatetoaddress 1 bcrt1q9w437k3luux5crekejss56r8cysxhr4ypuha22
```

**d. Check the resulting UTXO**

Finally, we can verify with `listunspent`:

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "828ec7cedc36f9517bd44a8e2a813be906698125c7c80b9a71a3202f2c09438c",
    "vout": 0,
    "address": "bcrt1qkyrgk8wkau455lytvggyp5wwtds2rr2m0f5kfg",
    "label": "",
    "scriptPubKey": "0014b1068b1dd6ef2b4a7c8b621040d1ce5b60a18d5b",
    "amount": 49.49998759,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/3]02759296d087fc8a6746c5949ccf44fb8c1ec84fd2898f0b3d636a1fb861f279e8)#grjvnzy9",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
...
```

Notice that we now have a new UTXO/txid with `49.49998759` BTC (49.49999859 BTC from the original UTXO minus 0.000011 BTC in fees).

**3. Spending the entire amount with manual fee control**

In this case, we want to send the **entire UTXO balance** to a single address **without creating change**, but **setting the fee ourselves** rather than having Core deduct it automatically.

The logic is simple: **output value = input value - desired fee**.

Thus, the difference between input and output is precisely the fee, and no change address is needed.

**a. Prepare destination address**

```bash
bitcoin-cli -datadir="." getnewaddress
# bcrt1qnpsadfag5mupmjyq3j8ksrr7rzxz6uawmpfuyk
```

**b. Calculate the send amount**

Suppose the available UTXO has `49.49998759` **BTC** (the UTXO from Scenario 2) and we want to pay a fee of `0.0001` **BTC**:

```bash
VALUE -> 49.49998759 - 0.0001
# 49.49988759
```

**c. Create the raw transaction with the fee already deducted**

```bash
bitcoin-cli -datadir="." createrawtransaction '[{"txid":"828ec7cedc36f9517bd44a8e2a813be906698125c7c80b9a71a3202f2c09438c","vout":0}]' '{"bcrt1qnpsadfag5mupmjyq3j8ksrr7rzxz6uawmpfuyk":49.49988759}'
# 02000000018c43092c2f20a3719a0bc8c725816906e93b812a8e4ad47b51f936dccec78e820000000000fdffffff0197d50a27010000001600149861d6a7a8a6f81dc8808c8f680c7e188c2d73ae00000000
```

The command returns a **raw hex** that leaves no room for change.

**d. Sign**

```bash
bitcoin-cli -datadir="." signrawtransactionwithwallet "02000000018c43092c2f20a3719a0bc8c725816906e93b812a8e4ad47b51f936dccec78e820000000000fdffffff0197d50a27010000001600149861d6a7a8a6f81dc8808c8f680c7e188c2d73ae00000000"
{
  "hex": "020000000001018c43092c2f20a3719a0bc8c725816906e93b812a8e4ad47b51f936dccec78e820000000000fdffffff0197d50a27010000001600149861d6a7a8a6f81dc8808c8f680c7e188c2d73ae0247304402200a243753e4417acd396221ef6461adf023b2c6b29a3fde1c87311c6bfc2863140220322ab5d37b10cf336c6f9ef4d504dfa7a7b1b5280680b790d0be42e7662ca1de012102759296d087fc8a6746c5949ccf44fb8c1ec84fd2898f0b3d636a1fb861f279e800000000",
  "complete": true
}
```

**e. Send and confirm**

```bash
bitcoin-cli -datadir="." sendrawtransaction "020000000001018c43092c2f20a3719a0bc8c725816906e93b812a8e4ad47b51f936dccec78e820000000000fdffffff0197d50a27010000001600149861d6a7a8a6f81dc8808c8f680c7e188c2d73ae0247304402200a243753e4417acd396221ef6461adf023b2c6b29a3fde1c87311c6bfc2863140220322ab5d37b10cf336c6f9ef4d504dfa7a7b1b5280680b790d0be42e7662ca1de012102759296d087fc8a6746c5949ccf44fb8c1ec84fd2898f0b3d636a1fb861f279e800000000"
# 647c2b177ddeeb222e339e69a3237bdaca71aad881a6a81d74591c6a120934b4
```

```bash
bitcoin-cli -datadir="." generatetoaddress 1 bcrt1q9w437k3luux5crekejss56r8cysxhr4ypuha22
```

**f. Verify the new UTXO**

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "647c2b177ddeeb222e339e69a3237bdaca71aad881a6a81d74591c6a120934b4",
    "vout": 0,
    "address": "bcrt1qnpsadfag5mupmjyq3j8ksrr7rzxz6uawmpfuyk",
    "label": "",
    "scriptPubKey": "00149861d6a7a8a6f81dc8808c8f680c7e188c2d73ae",
    "amount": 49.49988759,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/4]03df6d57b8af03faf7ff2aeee55347c397ea08756403d88d5d2981e546529939e8)#9xz6j0nm",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
  ...
```

---

Throughout these three scenarios, we have seen that even in a "simple" transaction, **change** is the crucial detail separating a safe operation from a costly mistake:

- **Scenario 1** — Partial spend: Core automatically creates a change address and calculates the fee.
- **Scenario 2** — Full sweep with `subtractfeefromamount`: Core deducts the fee directly from the output, avoiding change.
- **Scenario 3** — Full sweep with manual fee: you explicitly set `input - output = fee`, with no change.

**If you ignore change**—for example, by calling `createrawtransaction` where the sum of outputs is less than the sum of inputs and **you neither add a change output nor use `subtractfeefromamount`—the entire difference becomes the miner fee**.

On mainnet, this could mean losing a significant number of satoshis (or entire bitcoins) in a single transaction.

Therefore, always ask yourself before signing and broadcasting:

- Do the **outputs add up to exactly what I expect?**
- Am I letting Core handle the change, or did I manually adjust the output to account for the intended fee?

With this simple check, you ensure that every single satoshi goes to the right destination and avoid accidentally handing over the remainder to miners as an unintended fee.

---

## **Multi-Output Transactions (Batching)**

A standard best practice for saving on fees and block space is sending funds to **multiple recipients within a single transaction**. This technique is known as **batching** and is widely adopted by exchanges and payment processors.

Instead of broadcasting separate transactions for each payout, we combine all outputs into a single raw transaction. The result is a **single input** (or a few selected inputs) funding **multiple outputs**, drastically lowering the overall fee because Bitcoin fees depend on transaction weight in virtual bytes (vbytes), not the monetary value transferred.

Let's look at a practical walkthrough.

**a. Prepare destination addresses**
Let's generate two addresses to simulate different recipients:

```bash
bitcoin-cli -datadir="." getnewaddress
# bcrt1q7waheqekh39xlscz5ct28dqhhhh0u8v8nwh42n (Kaká)
```

```bash
bitcoin-cli -datadir="." getnewaddress
# bcrt1qllxahh4su69rszmyjr93y3t07h57nwny0j95ks (Carol)
```

Suppose we have a UTXO of **49.49988759 BTC** (the output from the previous scenario).

**b. Create the raw transaction with multiple outputs**
We assign an amount for each recipient, for example:

- Kaká: **0.7 BTC**
- Carol: **1.2 BTC**

```bash
bitcoin-cli -datadir="." createrawtransaction   '[{"txid":"647c2b177ddeeb222e339e69a3237bdaca71aad881a6a81d74591c6a120934b4","vout":0}]' '{"bcrt1q7waheqekh39xlscz5ct28dqhhhh0u8v8nwh42n":0.7,
    "bcrt1qllxahh4su69rszmyjr93y3t07h57nwny0j95ks":1.2}'
# 0200000001b43409126a1c59741da8a681d8aa71cada7b23a3699e332e22ebde7d172b7c640000000000fdffffff02801d2c0400000000160014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d87000e270700000000160014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba6400000000
```

This command creates the **raw hex** with **two outputs**.

**c. Fund with fee and change**
Since we are sending only 1.9 BTC out of the total, we need Core to calculate the fee and create a change address for the remaining balance.

```bash
bitcoin-cli -datadir="." fundrawtransaction "0200000001b43409126a1c59741da8a681d8aa71cada7b23a3699e332e22ebde7d172b7c640000000000fdffffff02801d2c0400000000160014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d87000e270700000000160014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba6400000000" \
'{"feeRate":0.00001000}'
{
  "hex": "0200000001b43409126a1c59741da8a681d8aa71cada7b23a3699e332e22ebde7d172b7c640000000000fdffffff03801d2c0400000000160014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d876ba9b71b01000000160014a71ab94297573c130d6ea2f9aa25047903f57787000e270700000000160014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba6400000000",
  "fee": 0.00000172,
  "changepos": 1
}
```

**d. Sign and send**

```bash
bitcoin-cli -datadir="." signrawtransactionwithwallet "0200000001b43409126a1c59741da8a681d8aa71cada7b23a3699e332e22ebde7d172b7c640000000000fdffffff03801d2c0400000000160014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d876ba9b71b01000000160014a71ab94297573c130d6ea2f9aa25047903f57787000e270700000000160014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba6400000000"
{
  "hex": "02000000000101b43409126a1c59741da8a681d8aa71cada7b23a3699e332e22ebde7d172b7c640000000000fdffffff03801d2c0400000000160014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d876ba9b71b01000000160014a71ab94297573c130d6ea2f9aa25047903f57787000e270700000000160014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba6402473044022070655be3c7e287e70b81a4e928abd20d02fc5fc264f9111a52c0094c392c4dc802203920cb46a11bbe08d8dcc9de5b8412b5556a62cd6ead46ca0786d78d31ee6e63012103df6d57b8af03faf7ff2aeee55347c397ea08756403d88d5d2981e546529939e800000000",
  "complete": true
}
```

```bash
bitcoin-cli -datadir="." sendrawtransaction "02000000000101b43409126a1c59741da8a681d8aa71cada7b23a3699e332e22ebde7d172b7c640000000000fdffffff03801d2c0400000000160014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d876ba9b71b01000000160014a71ab94297573c130d6ea2f9aa25047903f57787000e270700000000160014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba6402473044022070655be3c7e287e70b81a4e928abd20d02fc5fc264f9111a52c0094c392c4dc802203920cb46a11bbe08d8dcc9de5b8412b5556a62cd6ead46ca0786d78d31ee6e63012103df6d57b8af03faf7ff2aeee55347c397ea08756403d88d5d2981e546529939e800000000"
# b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79
```

**e. Confirm and inspect**
Mine a block to confirm:

```bash
bitcoin-cli -datadir="." generatetoaddress 1 bcrt1q9w437k3luux5crekejss56r8cysxhr4ypuha22
```

List the UTXOs:

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79",
    "vout": 0,
    "address": "bcrt1q7waheqekh39xlscz5ct28dqhhhh0u8v8nwh42n",
    "label": "",
    "scriptPubKey": "0014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d87",
    "amount": 0.70000000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/5]039c8a99f8d6008801b97a6ec5f0ca231e706ddb28edebd12666b0f16aef7a48f2)#duqx02j9",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
    "txid": "b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79",
    "vout": 1,
    "address": "bcrt1q5udtjs5h2u7pxrtw5tu65fgy0ypl2au8rkfg62",
    "scriptPubKey": "0014a71ab94297573c130d6ea2f9aa25047903f57787",
    "amount": 47.59988587,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/1/3]022a3cae7145dcfe74772d35b16fdb40e5fe0cf8fc3950eb5b9048a2b70d271e6f)#7uhj7gdg",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/1/*)#jtyys78l"
    ],
    "safe": true
  },
  {
    "txid": "b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79",
    "vout": 2,
    "address": "bcrt1qllxahh4su69rszmyjr93y3t07h57nwny0j95ks",
    "label": "",
    "scriptPubKey": "0014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba64",
    "amount": 1.20000000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/6]037994b04a5183d16e24f1a3a2a08bf1fcd5c528e5efcc3855065a6f3e0659ae0f)#ax5l0vfn",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
  ...
```

You will see **three outputs** (in addition to others not relevant here):

1. **0.7 BTC** to Kaká
2. **1.2 BTC** to Carol
3. The **change** (`47.59988587`) back to your wallet.

---

**Why does batching save fees?**

If you created two separate transactions—one for 0.7 BTC and another for 1.2 BTC—you would pay base transaction overhead **twice**, including two transaction headers, input signatures, and separate change outputs.

In transaction batching, the majority of transaction size comes from inputs; adding extra outputs has a much lower marginal byte cost.

---

## **UTXO Consolidation**

**Consolidation** means combining multiple smaller UTXOs into a single, larger UTXO.
**Advantages:** Future transactions will require fewer inputs (making them cheaper) and wallet state remains cleaner.
**Caution:** Consolidation links those UTXOs together on-chain, creating a direct privacy impact (common-input ownership heuristic). Avoid co-mingling KYC and non-KYC funds, and schedule consolidations during periods of low mempool fee rates.

Let's walk through a step-by-step guide to consolidating UTXOs.

**a) Identify small UTXOs**

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79",
    "vout": 0,
    "address": "bcrt1q7waheqekh39xlscz5ct28dqhhhh0u8v8nwh42n",
    "label": "",
    "scriptPubKey": "0014f3bb7c8336bc4a6fc302a616a3b417bdeefe1d87",
    "amount": 0.70000000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/5]039c8a99f8d6008801b97a6ec5f0ca231e706ddb28edebd12666b0f16aef7a48f2)#duqx02j9",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
    "txid": "b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79",
    "vout": 2,
    "address": "bcrt1qllxahh4su69rszmyjr93y3t07h57nwny0j95ks",
    "label": "",
    "scriptPubKey": "0014ffcddbdeb0e68a380b6490cb12456ff5e9e9ba64",
    "amount": 1.20000000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/6]037994b04a5183d16e24f1a3a2a08bf1fcd5c528e5efcc3855065a6f3e0659ae0f)#ax5l0vfn",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
    "txid": "1417f599358ea49a63dd253a3b3701ce0fa28cdf006522e4a3c50c48fce12e8e",
    "vout": 0,
    "address": "bcrt1qkqp9xzkre29gl7kl7d3s264nstysw7fqjj5pqf",
    "label": "",
    "scriptPubKey": "0014b002530ac3ca8a8ffadff363056ab382c9077920",
    "amount": 0.50000000,
    "confirmations": 4,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/1]0238caef26a2025d89d4230bcc7e2d1dbdcc8ce51ce1c07cd4509a76495bba07d9)#8q3llhqf",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  ...
]

```

Suppose we select these **three UTXOs** from the previous examples:

- A: `txid b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79`, `vout:0`, **0.70000000 BTC**
- B: `txid b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79`, `vout:2`, **1.20000000 BTC**
- C: `txid 1417f599358ea49a63dd253a3b3701ce0fa28cdf006522e4a3c50c48fce12e8e`, `vout:0`, **0.50000000 BTC**
    
    **Total = 2.40000000 BTC**

**b) Generate a wallet address to receive the consolidated funds**

```bash
bitcoin-cli -datadir="." getnewaddress
# bcrt1qnk9lxpt4ch7zkp9ncdr3awe0aa0e49kp5v6453
```

**Option 1 — Using `fundrawtransaction` (no change via `subtractFeeFromOutputs`)**

Simpler approach: you specify the **total** on the output and instruct Core to **deduct the fee from that output**, avoiding any change creation.

**1. Create the raw hex with 3 inputs and 1 output (2.4 BTC)**

```bash
bitcoin-cli -datadir="." createrawtransaction \
 '[{"txid":"b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79","vout":0},{"txid":"b9554be708c5ea7414876a3757a65df19cd5ddf8c19365c8425c3f8ce8066d79","vout":2},{"txid":"1417f599358ea49a63dd253a3b3701ce0fa28cdf006522e4a3c50c48fce12e8e","vout":0}]' \
  '{"bcrt1qnk9lxpt4ch7zkp9ncdr3awe0aa0e49kp5v6453":2.4}'
# 0200000003796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90000000000fdffffff796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90200000000fdffffff8e2ee1fc480cc5a3e4226500df8ca20fce01373b3a25dd639aa48e3599f517140000000000fdffffff01001c4e0e000000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c100000000
```

**2. Fund: fee and no change**

```bash
bitcoin-cli -datadir="." fundrawtransaction "0200000003796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90000000000fdffffff796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90200000000fdffffff8e2ee1fc480cc5a3e4226500df8ca20fce01373b3a25dd639aa48e3599f517140000000000fdffffff01001c4e0e000000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c100000000" \
  '{"add_inputs":false, "feeRate":0.00001000, "subtractFeeFromOutputs":[0]}'
#
{
  "hex": "0200000003796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90000000000fdffffff796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90200000000fdffffff8e2ee1fc480cc5a3e4226500df8ca20fce01373b3a25dd639aa48e3599f517140000000000fdffffff010b1b4e0e000000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c100000000",
  "fee": 0.00000245,
  "changepos": -1
}
```

A **changepos** value of `-1` indicates that no change output was created.

**3. Sign and send**

```bash
bitcoin-cli -datadir="." signrawtransactionwithwallet "0200000003796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90000000000fdffffff796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90200000000fdffffff8e2ee1fc480cc5a3e4226500df8ca20fce01373b3a25dd639aa48e3599f517140000000000fdffffff010b1b4e0e000000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c100000000"
{
  "hex": "02000000000103796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90000000000fdffffff796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90200000000fdffffff8e2ee1fc480cc5a3e4226500df8ca20fce01373b3a25dd639aa48e3599f517140000000000fdffffff010b1b4e0e000000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c10247304402203664d96a5f91c916e213e9a6adabda0c4a2031abe9db7e1a8f2f996f9fdbad91022070ea8353ce9281456776f5e723c48c1aa022a4adb35a207f9644c0338d95c6310121039c8a99f8d6008801b97a6ec5f0ca231e706ddb28edebd12666b0f16aef7a48f20247304402203c350e5bd7a9a69fde895df1ae95d6935383c7ac7554f53ac10437391d45d3fd02202fbfc490b365afe774bb4771650ec9bb81e813a6df547e523ed9bacf4fa1d6f50121037994b04a5183d16e24f1a3a2a08bf1fcd5c528e5efcc3855065a6f3e0659ae0f0247304402206e422304d7a85fb96a9624c532cabd2ae0354711554410b7360cff55df14a57e02202bdbd8fb1983d5d3f24f859f735c11b174bfea9a5b813e77e8a9734047620a7001210238caef26a2025d89d4230bcc7e2d1dbdcc8ce51ce1c07cd4509a76495bba07d900000000",
  "complete": true
}
```

```bash
bitcoin-cli -datadir="." sendrawtransaction "02000000000103796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90000000000fdffffff796d06e88c3f5c42c86593c1f8ddd59cf15da657376a871474eac508e74b55b90200000000fdffffff8e2ee1fc480cc5a3e4226500df8ca20fce01373b3a25dd639aa48e3599f517140000000000fdffffff010b1b4e0e000000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c10247304402203664d96a5f91c916e213e9a6adabda0c4a2031abe9db7e1a8f2f996f9fdbad91022070ea8353ce9281456776f5e723c48c1aa022a4adb35a207f9644c0338d95c6310121039c8a99f8d6008801b97a6ec5f0ca231e706ddb28edebd12666b0f16aef7a48f20247304402203c350e5bd7a9a69fde895df1ae95d6935383c7ac7554f53ac10437391d45d3fd02202fbfc490b365afe774bb4771650ec9bb81e813a6df547e523ed9bacf4fa1d6f50121037994b04a5183d16e24f1a3a2a08bf1fcd5c528e5efcc3855065a6f3e0659ae0f0247304402206e422304d7a85fb96a9624c532cabd2ae0354711554410b7360cff55df14a57e02202bdbd8fb1983d5d3f24f859f735c11b174bfea9a5b813e77e8a9734047620a7001210238caef26a2025d89d4230bcc7e2d1dbdcc8ce51ce1c07cd4509a76495bba07d900000000"
# 61db943161c00e8cf797cb8d4e3d896e88f52c8e39490e735d70abaa6a74ce73
```

**4. Confirm and inspect the single consolidated UTXO**

```bash
bitcoin-cli -datadir="." generatetoaddress 1 bcrt1q9w437k3luux5crekejss56r8cysxhr4ypuha22
```

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "61db943161c00e8cf797cb8d4e3d896e88f52c8e39490e735d70abaa6a74ce73",
    "vout": 0,
    "address": "bcrt1qnk9lxpt4ch7zkp9ncdr3awe0aa0e49kp5v6453",
    "label": "",
    "scriptPubKey": "00149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c1",
    "amount": 2.39999755,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/7]02b1f28fe1718cb0d19d63ca8f00f1da97a9ca6a2f2fe58ea38dc8764271fd9bb9)#v6xev5z7",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
  ...
```

Notice that we now have a single UTXO containing `2.39999755` BTC (2.4 consolidated BTC minus the mining fee).

**Option 2 — Full manual control (without `fundrawtransaction`)**
We can specify our own fee directly and set the output value as **sum(inputs) - fee** (leaving no change). In this scenario, we will consolidate 3 UTXOs received from mining rewards in previous examples.

**1. Calculate the output amount**

```bash
VALUE=150-(0.0001)
VALUE=149.9999
```

**2. Create the raw transaction with no change output**

```bash
bitcoin-cli -datadir="." createrawtransaction \
'[{"txid":"347775cd427f4e7b88906ce5ca8c11570822063c76280cc2e63879e6ed956323","vout":0},{"txid":"cebd41bfe9964f604f7247ee0c27a1bec23a55880c5be1c91b3889f4e2277808","vout":0},{"txid":"1a2c538fb7b78a8898ddc82b79dd593922d402153c7ff97491e539a91b57fde7","vout":0}]' \
  '{"bcrt1qnk9lxpt4ch7zkp9ncdr3awe0aa0e49kp5v6453":149.9999}'
# 0200000003236395ede67938e6c20c28763c06220857118ccae56c90887b4e7f42cd7577340000000000fdffffff087827e2f489381bc9e15b0c88553ac2bea1270cee47724f604f96e9bf41bdce0000000000fdffffffe7fd571ba939e59174f97f3c1502d4223959dd792bc8dd98888ab7b78f532c1a0000000000fdffffff01f0ae117e030000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c100000000
```

**3. Sign, send, and confirm**

```bash
bitcoin-cli -datadir="." signrawtransactionwithwallet "0200000003236395ede67938e6c20c28763c06220857118ccae56c90887b4e7f42cd7577340000000000fdffffff087827e2f489381bc9e15b0c88553ac2bea1270cee47724f604f96e9bf41bdce0000000000fdffffffe7fd571ba939e59174f97f3c1502d4223959dd792bc8dd98888ab7b78f532c1a0000000000fdffffff01f0ae117e030000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c10247304402204aa694a69c037ab059f75affd9db353cc2d54438c2d22d0a69f5996ae4e3b4d302205ea15356e49c0ae44ba9e110e3e0ff1f83b76943ace7d62171e6fa7e70154b190121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba70247304402202ceef57fb7564c5108dfcadb719b6dfc34747ec30b13fe2c306bb76ee73902c30220349cbc0e130f446bc0313afe0502850e792d3e0edc08d198f89091b04607d4b90121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba70247304402202c56c84d7bc2bdac40cfb9d3baea64e23193fb9145cd1da9737795c4553991e002205d7ec73eff147ac9903057abe1ff78fe54cdcc63f8270a52810dd3c44d86ab390121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba700000000"
{
  "hex": "02000000000103236395ede67938e6c20c28763c06220857118ccae56c90887b4e7f42cd7577340000000000fdffffff087827e2f489381bc9e15b0c88553ac2bea1270cee47724f604f96e9bf41bdce0000000000fdffffffe7fd571ba939e59174f97f3c1502d4223959dd792bc8dd98888ab7b78f532c1a0000000000fdffffff01f0ae117e030000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c10247304402204aa694a69c037ab059f75affd9db353cc2d54438c2d22d0a69f5996ae4e3b4d302205ea15356e49c0ae44ba9e110e3e0ff1f83b76943ace7d62171e6fa7e70154b190121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba70247304402202ceef57fb7564c5108dfcadb719b6dfc34747ec30b13fe2c306bb76ee73902c30220349cbc0e130f446bc0313afe0502850e792d3e0edc08d198f89091b04607d4b90121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba70247304402202c56c84d7bc2bdac40cfb9d3baea64e23193fb9145cd1da9737795c4553991e002205d7ec73eff147ac9903057abe1ff78fe54cdcc63f8270a52810dd3c44d86ab390121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba700000000",
  "complete": true
}
```

```bash
bitcoin-cli -datadir="." sendrawtransaction "02000000000103236395ede67938e6c20c28763c06220857118ccae56c90887b4e7f42cd7577340000000000fdffffff087827e2f489381bc9e15b0c88553ac2bea1270cee47724f604f96e9bf41bdce0000000000fdffffffe7fd571ba939e59174f97f3c1502d4223959dd792bc8dd98888ab7b78f532c1a0000000000fdffffff01f0ae117e030000001600149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c10247304402204aa694a69c037ab059f75affd9db353cc2d54438c2d22d0a69f5996ae4e3b4d302205ea15356e49c0ae44ba9e110e3e0ff1f83b76943ace7d62171e6fa7e70154b190121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba70247304402202ceef57fb7564c5108dfcadb719b6dfc34747ec30b13fe2c306bb76ee73902c30220349cbc0e130f446bc0313afe0502850e792d3e0edc08d198f89091b04607d4b90121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba70247304402202c56c84d7bc2bdac40cfb9d3baea64e23193fb9145cd1da9737795c4553991e002205d7ec73eff147ac9903057abe1ff78fe54cdcc63f8270a52810dd3c44d86ab390121024bdbdf6b6c264db5a9a9f2ffb6f964f228c722c419ffd7ae26a7b850bfce6ba700000000"
# 2c668e312971983fc465d8c79f5813732f288331cda23dd86fd73fc5339e2984
```

```bash
bitcoin-cli -datadir="." generatetoaddress 1 bcrt1q9w437k3luux5crekejss56r8cysxhr4ypuha22
```

We can list our UTXOs to verify the consolidation.

```bash
bitcoin-cli -datadir="." listunspent
[
  {
    "txid": "2c668e312971983fc465d8c79f5813732f288331cda23dd86fd73fc5339e2984",
    "vout": 0,
    "address": "bcrt1qnk9lxpt4ch7zkp9ncdr3awe0aa0e49kp5v6453",
    "label": "",
    "scriptPubKey": "00149d8bf30575c5fc2b04b3c3471ebb2fef5f9a96c1",
    "amount": 149.99990000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wpkh([2f5cd395/84h/1h/0h/0/7]02b1f28fe1718cb0d19d63ca8f00f1da97a9ca6a2f2fe58ea38dc8764271fd9bb9)#v6xev5z7",
    "parent_descs": [
      "wpkh(tpubD6NzVbkrYhZ4WtpQ21uY5dQCNe2wu8GdTcB7zLmVcdvJPFjQ8c4FNq1wR4zsr1qc1XgZqVAmd6m6uHrSJhrfTHsy5cnw5yyQaWG49guuByL/84h/1h/0h/0/*)#rlp9dth8"
    ],
    "safe": true
  },
  {
  ...
```

Notice that we now have a single UTXO containing `149.99990000` BTC.

---

Constructing transactions manually in Bitcoin Core is far more than an intellectual exercise: it is a **hands-on laboratory for understanding the protocol**. Throughout this article, we covered scenarios ranging from basic sends with automatic change handling to more advanced strategies such as **batching** and **UTXO consolidation**.

These examples highlight several essential truths:

- **Every satoshi matters** — neglecting fee calculations or change output definitions can turn an oversight into an exorbitant miner fee.
- **Control is power** — manually selecting inputs, determining fee rates, and deciding when to consolidate UTXOs allows you to minimize on-chain expenses and keep your wallet orderly.
- **Privacy requires deliberate planning** — consolidating or co-spending UTXOs reveals common-ownership links across addresses. In production environments, always pair these techniques with solid privacy practices.

Practicing these commands on `regtest` or `signet` provides the safety of a sandbox, but the knowledge translates directly to **mainnet**. Before broadcasting transactions with real funds, always verify:

1. **Sum of outputs vs. inputs** — ensure the discrepancy equals your intended mining fee.
2. **Change destination** — verify the change address is under your control, or use `subtractfeefromamount` when sweeping outputs.
3. **Mempool fee rates** — adjust fees according to current network congestion to balance cost and confirmation priority.

Mastering these workflows gives you not only the confidence to operate directly on the Bitcoin network, but also a **profound understanding of the UTXO model** that powers it.

In subsequent articles, we will explore advanced transaction techniques including **Partially Signed Bitcoin Transactions (PSBTs)**, **multisig wallets**, and **timelocks**.
