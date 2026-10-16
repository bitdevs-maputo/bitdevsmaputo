---
layout: post
published: true
date: 2026-10-14
title: "Advanced Transfers and Security in Bitcoin"
description: "Strengthen the security of your Bitcoin transfers: learn about PSBT (BIP174), multisig wallets, and timelock rules in Bitcoin Core."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/advanced-transfers
---
## Advanced Transfers and Security

In the three previous articles of the **Bitcoin Transfers** series, we explored everything from the basic anatomy of a transaction to more efficient sending strategies, always with a practical emphasis on using Bitcoin Core on test networks. Now we move forward: beyond moving bitcoin correctly and cheaply, it is time to think about **how to strengthen the security of every transfer**.

This step is essential because, in the Bitcoin ecosystem, protection does not depend only on safeguarding the private key. The concept of defense in depth shows that real security emerges when we build several barriers: from key generation to the very way we structure transactions. Features such as **multisig** and **timelocks** allow us to create operations that resist loss, theft, or unauthorized access, offering resilience even in failure scenarios.

In this article, we will see how to apply each of these techniques, combining theory and practice so that your transfers not only happen, but are more robust and versatile. First, let's understand **PSBTs (Partially Signed Bitcoin Transactions)**, which are fundamental for using these advanced features.

---

### PSBT – Partially Signed Transactions

A **PSBT** is a standard defined in [BIP174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki) that allows transactions to be created, shared, and signed collaboratively.

It clearly separates the stages:

1. **Raw transaction creation:** whoever selects the UTXOs and defines the destinations.
2. **Signing:** each participant signs only their part, on their own device.
3. **Finalization/Broadcast:** final assembly and submission to the network.

This ensures that **no single device needs all the keys** or full internet access, which is essential for **multisig**, **hardware wallets**, or **air-gapped setups**.

**Basic commands in Bitcoin Core:**

| Step | Command |
| --- | --- |
| Create a PSBT with defined inputs/outputs | `walletcreatefundedpsbt` |
| Sign partially | `walletprocesspsbt` |
| Combine several PSBTs (multiple signers) | `combinepsbt` |
| Finalize (produces broadcastable hex) | `finalizepsbt` |
| Send | `sendrawtransaction` |

**A PSBT is useful even with a single signer** when you separate environments: create the transaction on one machine and sign it on another (secure/offline).

Let's go through an example in Bitcoin Core.

**0) Prerequisites**

- You already have a wallet with a balance on signet.

**1) Create the PSBT (selects UTXOs and defines outputs)**

```bash
bitcoin-cli -datadir="." walletcreatefundedpsbt \
  '[]' '[{"tb1q2tygw0rd24cgrrj9dajqrh398clxucnhdwlxew":0.0001}]' \
  0 '{"subtractFeeFromOutputs":[0]}' true
{
  "psbt": "cHNidP8BAHECAAAAAXT7uaRFVyzfv8vbDqsOc4AWZzxAoX0S...(shortened, same as the original)...AAAAA=",
  "fee": 0.00001410,
  "changepos": 1
}
```

**2) Sign partially (in the same wallet)**

```bash
bitcoin-cli -datadir="." walletprocesspsbt "cHNidP8BAHECAAAAAXT7uaRFVyzfv8vbDqsOc4AWZzxAoX0S...(shortened)..."
{
  "psbt": "cHNidP8BAHECAAAAAXT7uaRFVyzfv8vbDqsOc4AWZzxAoX0S...(shortened)...",
  "complete": true,
  "hex": "0200000000010174fbb9a445572cdfbfcbdb0eab0e738016673c...(shortened)...00000000"
}
```

`walletprocesspsbt` adds the signatures that the wallet is able to produce. In a regular (non-multisig) wallet, this leaves `complete=true`.

Explaining the fields the command returns:

**`psbt`**

- This is the **partially signed transaction** (still in *PSBT format*, base64).
- It is useful if you were going to **pass it to another signer** or wanted to store the file.
- If `complete` were `false`, this would be the value to send to the next participant or to use in `finalizepsbt`.

**`complete`**

- `true` means that *all* required signatures have already been added.
- If it were `false`, you would keep circulating the PSBT among the parties or run `combinepsbt`, etc.

**`hex`**

- This is the **final Bitcoin transaction**, already serialized (raw hex) and ready for the network.
- When `complete` is `true`, Core already hands you this hex, which can be broadcast right away.

**3) Finalize and broadcast**

**Since `complete = true`**, there is no need to call `finalizepsbt`. Just take the `hex` value and broadcast it:

```bash
bitcoin-cli -datadir="." sendrawtransaction "0200000000010174fbb9a445572cdfbfcbdb0eab0e738016673c...(shortened)...00000000"
# a1a93c02cfb449040677950d1abf33f57c923273d5f091c942c08d229e638ce4
```

**If `complete` = false**, we would use the returned `"psbt"`:

```bash
bitcoin-cli -datadir="." finalizepsbt "<SIGNED_PSBT>"
```

This command would produce the final hex to be broadcast.

### Multisig

Multisig is a custody scheme in Bitcoin in which a spend is only valid when a predefined minimum number of keys, among several participants, sign the transaction, such as "2-of-3" or "3-of-5", increasing security and allowing shared control.

**Advantages:**

- **Resistance to theft/loss:** 1 compromised key cannot spend the funds (in 2-of-3); losing 1 key still allows recovery.
- **Inheritance/backup:** keys distributed among different people/vaults.
- **Governance:** approval policies (m-of-n) for companies/DAOs.

Let's look at a practical example in Bitcoin Core:

**1) Create three wallets (participants)**

```bash
bitcoin-cli -datadir="." createwallet carteira1 true true "" true true
bitcoin-cli -datadir="." createwallet carteira2 true true "" true true
bitcoin-cli -datadir="." createwallet carteira3 true true "" true true
```

We create wallets **with private keys** and **with descriptors**. Avoid `blank=true` and `disable_private_keys=true` so you don't end up with "empty" wallets.

**2) Get the xpubs (with fingerprint/derivation)**

For each wallet, list the public descriptors and copy the **receiving (…/0/\*)** and **change (…/1/\*)** lines:

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira1 listdescriptors
{
  "wallet_name": "carteira1",
  "descriptors": [
    ...,
    {
      "desc": "wpkh([ba39c771/84h/1h/0h]tpubDCYmREHcMiWLvGJ4goQeYcvNARJtp8Bcuf2wSo5NZKHLHiu91xoH1135ngN3MmHHB9L6bYabHiFkBamEavcVeEoKGDWj7op1atN6xeCotwk/0/*)#jr2a4z9x",
      "timestamp": 1758650612,
      "active": true,
      "internal": false,
      "range": [
        0,
        999
      ],
      "next": 0,
      "next_index": 0
    },
    {
      "desc": "wpkh([ba39c771/84h/1h/0h]tpubDCYmREHcMiWLvGJ4goQeYcvNARJtp8Bcuf2wSo5NZKHLHiu91xoH1135ngN3MmHHB9L6bYabHiFkBamEavcVeEoKGDWj7op1atN6xeCotwk/1/*)#rh0ugh47",
      "timestamp": 1758650613,
      "active": true,
      "internal": true,
      "range": [
        0,
        999
      ],
      "next": 0,
      "next_index": 0
    }
  ]
}
```

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira2 listdescriptors
{
 ...,
    {
      "desc": "wpkh([1b69360a/84h/1h/0h]tpubDD2gr2TXupxDBjtLUnFkWVsNMYNNcPeLrRmR4M9Eo7NEShdCnJRcsccxRtzAKDT1F2cXGdSKPTerBX2FsYRUcDZtRNzd7rPeS9Fg3HMBC4x/0/*)#k32vf2uu",
      "timestamp": 1758650639,
      "active": true,
      "internal": false,
      "range": [
        0,
        999
      ],
      "next": 0,
      "next_index": 0
    },
    {
      "desc": "wpkh([1b69360a/84h/1h/0h]tpubDD2gr2TXupxDBjtLUnFkWVsNMYNNcPeLrRmR4M9Eo7NEShdCnJRcsccxRtzAKDT1F2cXGdSKPTerBX2FsYRUcDZtRNzd7rPeS9Fg3HMBC4x/1/*)#890d5lvy",
      "timestamp": 1758650640,
      "active": true,
      "internal": true,
      "range": [
        0,
        999
      ],
      "next": 0,
      "next_index": 0
    }
  ]
}
```

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira3 listdescriptors
{
  "wallet_name": "carteira3",
  "descriptors": [
    ...,
    {
      "desc": "wpkh([fd4d4620/84h/1h/0h]tpubDDnWDjzpV82Wxdr7woANyPdKnSvQvEERPnzxoK2iPLUf8M8HA6Dr1rKw5FqnUFabN5zbQjexYNTCW8QC16NUpd6m1JogodyjLe5fRYvQ5KT/0/*)#5szljz27",
      "timestamp": 1758650645,
      "active": true,
      "internal": false,
      "range": [
        0,
        999
      ],
      "next": 0,
      "next_index": 0
    },
    {
      "desc": "wpkh([fd4d4620/84h/1h/0h]tpubDDnWDjzpV82Wxdr7woANyPdKnSvQvEERPnzxoK2iPLUf8M8HA6Dr1rKw5FqnUFabN5zbQjexYNTCW8QC16NUpd6m1JogodyjLe5fRYvQ5KT/1/*)#9y870h6x",
      "timestamp": 1758650645,
      "active": true,
      "internal": true,
      "range": [
        0,
        999
      ],
      "next": 0,
      "next_index": 0
    }
  ]
}
```

**What to copy:** the public descriptors for receiving (…/0/\*) and change (…/1/\*). They carry the fingerprint + path (e.g., `[ba39c771/84h/1h/0h]tpub.../0/*`), which is essential for building the multisig correctly.

**Address standard:** the examples use the 84h/1h/0h derivation (Bech32, P2WPKH for singlesig). In multisig, we will combine them into P2WSH (`wsh(sortedmulti(...))`).

**3) Create the multisig wallet (watch-only) and import the multisig descriptors (receiving and change)**

**Why "watch-only"?** This wallet **sees** UTXOs, **generates addresses**, and **creates PSBTs**, but it has **no** private keys; the signatures happen in the participant wallets (carteira1, 2, and 3).

```bash
bitcoin-cli -datadir="." createwallet multisig-2of3 true true "" true true
{
  "name": "multisig-2of3",
  "warnings": [
    "Empty string given as passphrase, wallet will not be encrypted."
  ]
}
```

```bash
bitcoin-cli -datadir="." -rpcwallet=multisig-2of3 importdescriptors [{\"desc\":\"wsh(sortedmulti(2,[ba39c771/84h/1h/0h]tpubDCYmREHcMiWLvGJ4goQeYcvNARJtp8Bcuf2wSo5NZKHLHiu91xoH1135ngN3MmHHB9L6bYabHiFkBamEavcVeEoKGDWj7op1atN6xeCotwk/0/*,[1b69360a/84h/1h/0h]tpubDD2gr2TXupxDBjtLUnFkWVsNMYNNcPeLrRmR4M9Eo7NEShdCnJRcsccxRtzAKDT1F2cXGdSKPTerBX2FsYRUcDZtRNzd7rPeS9Fg3HMBC4x/0/*,[fd4d4620/84h/1h/0h]tpubDDnWDjzpV82Wxdr7woANyPdKnSvQvEERPnzxoK2iPLUf8M8HA6Dr1rKw5FqnUFabN5zbQjexYNTCW8QC16NUpd6m1JogodyjLe5fRYvQ5KT/0/*))#ed8gy0hl\",\"active\":true,\"timestamp\":\"now\"},{\"desc\":\"wsh(sortedmulti(2,[ba39c771/84h/1h/0h]tpubDCYmREHcMiWLvGJ4goQeYcvNARJtp8Bcuf2wSo5NZKHLHiu91xoH1135ngN3MmHHB9L6bYabHiFkBamEavcVeEoKGDWj7op1atN6xeCotwk/1/*,[1b69360a/84h/1h/0h]tpubDD2gr2TXupxDBjtLUnFkWVsNMYNNcPeLrRmR4M9Eo7NEShdCnJRcsccxRtzAKDT1F2cXGdSKPTerBX2FsYRUcDZtRNzd7rPeS9Fg3HMBC4x/1/*,[fd4d4620/84h/1h/0h]tpubDDnWDjzpV82Wxdr7woANyPdKnSvQvEERPnzxoK2iPLUf8M8HA6Dr1rKw5FqnUFabN5zbQjexYNTCW8QC16NUpd6m1JogodyjLe5fRYvQ5KT/1/*))#tcmu8qku\",\"active\":true,\"internal\":true,\"timestamp\":\"now\"}]
[
  {
    "success": true,
    "warnings": [
      "Range not given, using default keypool range"
    ]
  },
  {
    "success": true,
    "warnings": [
      "Range not given, using default keypool range"
    ]
  }
]
```

**`sortedmulti`**: guarantees a deterministic ordering of the keys (regardless of input order), avoiding different addresses for the same set of keys.
The **"Range not given"** warning only tells you that Core will use the **default range 0–999** to generate addresses. For most cases, that is fine.

**4) Receive funds into the multisig**

Generate a new address for this new multisig wallet:

```bash
bitcoin-cli -datadir="." -rpcwallet=multisig-2of3 getnewaddress
# tb1qrlwt49k9hqgj7m3rlc4elfj3fxe96l93zz9ez5209z8uskrqg7yqhl3v88
```

Send some sats to the generated address (via a signet faucet). Wait for 1+ confirmations.

**5) Create the spending PSBT (in the multisig wallet)**

```bash
bitcoin-cli -datadir="." -rpcwallet=multisig-2of3 walletcreatefundedpsbt "[]" "[{\"tb1qqu7d6zmh5mpf07xd7t9aehe0re63hfqk2wh2ew6045zc5svshphq7j4eek\":0.00001}]" 0 "{\"subtractFeeFromOutputs\":[0]}" true
{
  "psbt": "cHNidP8BAIkCAAAAAbALDAmCzaLpmGLM3HosXOuodp03BnzZ...(shortened, same as the original)...AAAAAA==",
  "fee": 0.00000201,
  "changepos": 0
}
```

`walletcreatefundedpsbt` **selects UTXOs**, builds the transaction, **calculates the fee**, and returns a **PSBT** with the metadata needed for signing.

**`subtractFeeFromOutputs`**: if set to output index 0, the fee is "deducted" from that output (useful for sending "whatever is left" without adjusting manually).

**6) Sign in two wallets (Carteira1 and Carteira2, separately)**

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira1 walletprocesspsbt "cHNidP8BAIkCAAAAAbALDAmCzaLpmGLM3HosXOuodp03BnzZ...(shortened, the original PSBT from step 5)..."
{
  "psbt": "cHNidP8BAIkCAAAAAbALDAmCzaLpmGLM3HosXOuodp03BnzZ...(shortened, PSBT with carteira1's signature)...",
  "complete": false
}
```

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira2 walletprocesspsbt "cHNidP8BAIkCAAAAAbALDAmCzaLpmGLM3HosXOuodp03BnzZ...(shortened, the original PSBT from step 5)..."
{
  "psbt": "cHNidP8BAIkCAAAAAbALDAmCzaLpmGLM3HosXOuodp03BnzZ...(shortened, PSBT with carteira2's signature)...",
  "complete": false
}
```

Each participant **signs** with `walletprocesspsbt`.

**Sequential vs. parallel:**

- *Sequential:* the output of carteira1 (a `psbt` already holding 1 signature) goes into carteira2 → it usually comes back with `complete: true`.
- *Parallel (the one we used in this example):* each signer signs the **same original PSBT**, and then you **combine** them (next step).

**7) Combine the 2 signed PSBTs**

```bash
bitcoin-cli -datadir="." combinepsbt "[\"<PSBT_SIGNED_BY_CARTEIRA1>\",\"<PSBT_SIGNED_BY_CARTEIRA2>\"]"
# cHNidP8BAIkCAAAAAbALDAmCzaLpmGLM3HosXOuodp03BnzZ...(shortened, combined PSBT)...
```

**When to use it:** if the signers signed **in parallel** (each took the original PSBT).

**Expected result:** the combined PSBT should already contain the **2 required signatures** (2-of-3).

**8) Finalize and broadcast**

```bash
bitcoin-cli -datadir="." finalizepsbt "<COMBINED_PSBT>"
{
  "hex": "02000000000101b00b0c0982cda2e99862ccdc7a2c5ceba8769d37067cd9...(shortened)...53ae00000000",
  "complete": true
}
```

**`finalizepsbt`**: validates the script, assembles the witness, and returns the **`hex`** ready for broadcast.

Finally, the **`sendrawtransaction`** command publishes the transaction to the network.

```bash
bitcoin-cli -datadir="." sendrawtransaction "02000000000101b00b0c0982cda2e99862ccdc7a2c5ceba8769d37067cd9...(shortened)...53ae00000000"
# af5f0813b622d6a21389af6cecbe9d5098d71cdee814e7ba70fcbe0a7d1ce407
```

Notice, in the mempool, that this is a 2-of-3 multisig transaction:

![mempool1.png](../assets/artigo10-img1.webp)

---

## Timelocks

In Bitcoin, **timelock** is the generic name for mechanisms that determine **when** a transaction or a given UTXO can be spent. Instead of merely requiring a valid signature, the protocol also checks **time or block height**, creating "mandatory waiting" conditions.

There are two main forms.

- **nLockTime:** a field inside the **transaction** itself that defines the **minimum block** (or a timestamp) from which the network accepts including it in a block. It is simple and useful for "scheduling" payments, but whoever holds the keys can discard that transaction and create another one without the lock.
- **CheckLockTimeVerify (CLTV):** a **script operation** that writes the restriction directly into the **UTXO**. In this case, the money "inherits" the lock: no spending is possible before the defined height/time, even if all the key holders want to change it.

There is also the **CheckSequenceVerify (CSV)** variant, which works similarly but is based on a relative interval of confirmations (e.g., "can be spent 144 blocks after this UTXO is confirmed").

These features make it possible to create contracts such as vaults with a recovery period, inheritances with future unlocking, or scheduled payments that only become valid after a certain date.

**a) nLockTime in practice**
**Goal:** create a transaction that **can only be mined** after a target block.

1. **Choose the target block** (e.g., current height + 2):

```bash
bitcoin-cli -datadir="." getblockcount
# 271141
```

The `getblockcount` command returns the current blockchain height. We can choose, for example, that the transaction can only be included from block **271145**.

2. **Create the transaction:**

```bash
bitcoin-cli -datadir="." -rpcwallet="demo-signet" createrawtransaction "[]" "{\"tb1q4asvsg6hhv6vwxzq5uy05wf6zzusp8me5xmlzv\":0.0001}" 271145
0200000000011027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7929230400
```

3. **Fund the transaction:**

```bash
bitcoin-cli -datadir="." -rpcwallet=demo-signet fundrawtransaction "0200000000011027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7929230400"
{
  "hex": "0200000001e48c639e228dc042c991f0d57332927cf533bf1a0d9577060449b4cf023ca9a10000000000fdffffff021027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7961320100000000001600143c7fa3189d4e5c9e6ca96eba73a525c94bf8ff9c29230400",
  "fee": 0.00000141,
  "changepos": 1
}
```

4. **Sign the transaction:**

```bash
bitcoin-cli -datadir="." -rpcwallet="demo-signet" signrawtransactionwithwallet "0200000001e48c639e228dc042c991f0d57332927cf533bf1a0d9577060449b4cf023ca9a10000000000fdffffff021027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7961320100000000001600143c7fa3189d4e5c9e6ca96eba73a525c94bf8ff9c29230400"
{
  "hex": "02000000000101e48c639e228dc042c991f0d57332927cf533bf1a0d9577060449b4cf023ca9a10000000000fdffffff021027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7961320100000000001600143c7fa3189d4e5c9e6ca96eba73a525c94bf8ff9c0247304402205e358ba9097c1f7efe67093fae52c4664cf17648f75185ae47a95a875db8fccb0220691d79b3eb4dc54b3c095e167340f084057b1f803f0375460ecfdc4c4af2dfa1012102ce170948697b4e2d96f3c85be5841c99a5deb2318855f9f041f23db9af7f62e829230400",
  "complete": true
}
```

5. **Send the transaction:**

Notice that if we try to broadcast the transaction before the defined block height, we get an error:

```bash
bitcoin-cli -datadir="." getblockcount
271143

bitcoin-cli -datadir="." sendrawtransaction "02000000000101e48c639e228dc042c991f0d57332927cf533bf1a0d9577060449b4cf023ca9a10000000000fdffffff021027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7961320100000000001600143c7fa3189d4e5c9e6ca96eba73a525c94bf8ff9c0247304402205e358ba9097c1f7efe67093fae52c4664cf17648f75185ae47a95a875db8fccb0220691d79b3eb4dc54b3c095e167340f084057b1f803f0375460ecfdc4c4af2dfa1012102ce170948697b4e2d96f3c85be5841c99a5deb2318855f9f041f23db9af7f62e829230400"
error code: -26
error message:
non-final
```

In Bitcoin, the **nLockTime** field works only as a **block validity rule**, not as an automatic scheduler. It defines the lowest block height (or timestamp) at which the transaction **can be included** in the blockchain, but the network does not "hold" it until then. If you try to broadcast it before the limit is reached, nodes reject it with the *non-final* error and nothing stays pending. That is why the software or script that creates the transaction must track the current height (for example, via `getblockcount`) and only **broadcast** when `current_height` is greater than or equal to the `nLockTime` value. This differs from a script timelock (such as `OP_CHECKLOCKTIMEVERIFY`), which writes the restriction into the **output** and lets you send the funding transaction today, guaranteeing it can only be spent after the deadline, without depending on external monitoring.
When we send it after the target, it works:

```bash
bitcoin-cli -datadir="." getblockcount
271145

bitcoin-cli -datadir="." sendrawtransaction "02000000000101e48c639e228dc042c991f0d57332927cf533bf1a0d9577060449b4cf023ca9a10000000000fdffffff021027000000000000160014af60c82357bb34c71840a708fa393a10b9009f7961320100000000001600143c7fa3189d4e5c9e6ca96eba73a525c94bf8ff9c0247304402205e358ba9097c1f7efe67093fae52c4664cf17648f75185ae47a95a875db8fccb0220691d79b3eb4dc54b3c095e167340f084057b1f803f0375460ecfdc4c4af2dfa1012102ce170948697b4e2d96f3c85be5841c99a5deb2318855f9f041f23db9af7f62e829230400"
# 2c91cbd4e8bccacb42020eb88a1df0816d99fae7e2ee12ff6a8c996ca282374b
```

**b) CLTV with Miniscript (a "strong" timelock on the UTXO)**

**Goal:** create a **P2WSH address** whose script requires a **minimum block height** to spend.

Let's go step by step.

1. **Create a new wallet**

We will create a new wallet so as not to mix it with other examples.

```bash
bitcoin-cli -datadir="." createwallet carteira_cltv
{
  "name": "carteira_cltv"
}
```

2. **Create a new address and get its information**

With the new wallet, we can generate a new address.

```bash
bitcoin-cli -datadir="." -rpcwallet="carteira_cltv" getnewaddress
# tb1q84ysz0zng7m8yad6zrps3uyn6reu977v85x0ga
```

Next, we can get the information for this new address (we will use it below):

```bash
bitcoin-cli -datadir="." -rpcwallet="carteira_cltv" getaddressinfo tb1q84ysz0zng7m8yad6zrps3uyn6reu977v85x0ga
{
  "address": "tb1q84ysz0zng7m8yad6zrps3uyn6reu977v85x0ga",
  "scriptPubKey": "00143d49013c5347b67275ba10c308f093d0f3c2fbcc",
  "ismine": true,
  "solvable": true,
  "desc": "wpkh([261430f9/84h/1h/0h/0/0]03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79)#l4tsyqsx",
  "parent_desc": "wpkh([261430f9/84h/1h/0h]tpubDDEKB1hKK8aCiLLPE35AqyEnRSbRTWgo27VVfG1iF8mdsJnYvuss736NutifM2NWnH78AVjW4hvHaDg3CzW7ZAHXVBMgPvoiYuYrZ5RgJii/0/*)#2hke87n4",
  "iswatchonly": false,
  "isscript": false,
  "iswitness": true,
  "witness_version": 0,
  "witness_program": "3d49013c5347b67275ba10c308f093d0f3c2fbcc",
  "pubkey": "03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79",
  "ischange": false,
  "timestamp": 1758845787,
  "hdkeypath": "m/84h/1h/0h/0/0",
  "hdseedid": "0000000000000000000000000000000000000000",
  "hdmasterfingerprint": "261430f9",
  "labels": [
    ""
  ]
}
```

From the `pubkey`, we can build a new, specific descriptor that produces addresses with a block-height restriction (`after(271220)`):

```bash
bitcoin-cli -datadir="." -rpcwallet="carteira_cltv" getdescriptorinfo "wsh(and_v(v:pk(03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79),after(271220)))"
{
  "descriptor": "wsh(and_v(v:pk(03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79),after(271220)))#gk4hzcry",
  "checksum": "gk4hzcry",
  "isrange": false,
  "issolvable": true,
  "hasprivatekeys": false
}
```

This command returns a descriptor already with its `#CHECKSUM` (in the example, `#gk4hzcry`).

3. **Derive a new address from the descriptor**

With the descriptor above, we can derive addresses that already carry the block-height restriction in their script.

```bash
bitcoin-cli -datadir="." -rpcwallet="carteira_cltv" deriveaddresses "wsh(and_v(v:pk(03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79),after(271220)))#gk4hzcry"
[
  "tb1qjtt0qckzytswg2fa25x7ru6unnulhttd0jx82z7jf8epv95wkqwqcq3ave"
]
```

Any UTXO associated with the address `tb1qjtt0qckzytswg2fa25x7ru6unnulhttd0jx82z7jf8epv95wkqwqcq3ave` can only be spent from block `271220` onward.

We can check the current block:

```bash
bitcoin-cli -datadir="." getblockcount
271211
```

4. **Send funds to the timelock address**

We can send some funds to this newly created address so that we can then test whether we are able to make transactions before the defined block height. We can use a faucet or send BTC from another wallet, as in the example below:

```bash
bitcoin-cli -datadir="." -rpcwallet="demo-signet" sendtoaddress "tb1qjtt0qckzytswg2fa25x7ru6unnulhttd0jx82z7jf8epv95wkqwqcq3ave" 0.0001
# 8cc8b2a47bff4a4b146f16ca2656bfb341bb95040ace91b4d6698e3c34d00c3a
```

In fact, that is all there is to using a script timelock (CLTV); it is already in place. The next steps only serve to demonstrate that we will need to wait until the specific block height to be able to spend this UTXO.

5. **Create a watch-only wallet**

Remember that, when Bitcoin Core creates a wallet, it creates it with those 8 default descriptors. In the previous steps, we generated a new address for the `carteira_cltv` wallet from a new descriptor. However, by default Core does not automatically associate all UTXOs of this new descriptor with the wallet. Therefore, if we run `listunspent` on the `carteira_cltv` wallet, it will not show the UTXO from the transaction above (the one that funded the address). To fix this, we will create a new watch-only wallet:

```bash
bitcoin-cli -datadir="." createwallet carteira_cltv_wo true
{
  "name": "carteira_cltv_wo"
}
```

And right after, we will use the `importdescriptors` command so that this new wallet sees the UTXOs associated with the addresses generated by the new descriptor:

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira_cltv_wo importdescriptors "[{\"desc\":\"wsh(and_v(v:pk(03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79),after(271220)))#gk4hzcry\",\"timestamp\":0,\"label\":\"cltv-271220\"}]"
[
  {
    "success": true
  }
]
```

This command may take a few minutes, since it scans all existing UTXOs.

Once the transaction that sent funds to this address is confirmed, we will be able to see the UTXO:

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira_cltv_wo listunspent
[
  {
    "txid": "8cc8b2a47bff4a4b146f16ca2656bfb341bb95040ace91b4d6698e3c34d00c3a",
    "vout": 1,
    "address": "tb1qjtt0qckzytswg2fa25x7ru6unnulhttd0jx82z7jf8epv95wkqwqcq3ave",
    "label": "cltv-271220",
    "witnessScript": "2103a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79ad03742304b1",
    "scriptPubKey": "002092d6f062c222e0e4293d550de1f35c9cf9fbad6d7c8c750bd249f216168eb01c",
    "amount": 0.00010000,
    "confirmations": 1,
    "spendable": true,
    "solvable": true,
    "desc": "wsh(and_v(v:pk([3d49013c]03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79),after(271220)))#dz9nuz04",
    "parent_descs": [
      "wsh(and_v(v:pk(03a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79),after(271220)))#gk4hzcry"
    ],
    "safe": true
  }
]
```

6. **Create a transaction and try to send it**

Now let's create a PSBT transaction to try to spend the locked UTXO.

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira_cltv_wo createpsbt "[{\"txid\":\"8cc8b2a47bff4a4b146f16ca2656bfb341bb95040ace91b4d6698e3c34d00c3a\",\"vout\":1,\"sequence\":4294967293}]" "[{\"tb1q3hhxstxlemumvsw2v8cgxwf860f6hxyk7p0d6v\":0.00009800}]" 271220
cHNidP8BAFICAAAAAToM0DQ8jmnWtJHOCgSVu0Gzv1YmyhZvFEtK/3ukssiMAQAAAAD9////AUgmAAAAAAAAFgAUje5oLN/O+bZBymHwgzkn09OrmJZ0IwQAAAAA
```

To be able to spend, I need to build a transaction in the expected format, so that the unlocking script is correct. Thus, we need to create the PSBT with the transaction's `TXID` (with its `vout`), `sequence`, the destination address, the amount, and the unlock block height.

Each input of a transaction has a `Sequence` field.

- If it stays at the maximum value (`0xffffffff`), the transaction's `nLockTime` is **ignored**.
- If you use a smaller value (e.g., `0xfffffffd`), `nLockTime` takes effect.

In our case, the real *timelock* is in the **UTXO's script** (`OP_CHECKLOCKTIMEVERIFY` generated by `after(...)`). `nSequence` only ensures that the transaction **respects** this timelock; it cannot "unlock" the UTXO early. Even if someone tries to change `nSequence` to get around it, the network will keep requiring that the minimum block height be reached before spending.

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira_cltv_wo walletprocesspsbt "cHNidP8BAFICAAAAAToM0DQ8jmnWtJHOCgSVu0Gzv1YmyhZvFEtK/3ukssiMAQAAAAD9////AUgmAAAAAAAAFgAUje5oLN/O+bZBymHwgzkn09OrmJZ0IwQAAAAA" false
{
  "psbt": "cHNidP8BAFICAAAAAToM0DQ8jmnWtJHOCgSVu0Gzv1YmyhZvFEtK/3ukssiM...(shortened)...",
  "complete": false
}
```

We complete/sign the PSBT transaction with the watch-only wallet. And then with the original wallet (which has the private keys):

```bash
bitcoin-cli -datadir="." -rpcwallet=carteira_cltv walletprocesspsbt "cHNidP8BAFICAAAAAToM0DQ8jmnWtJHOCgSVu0Gzv1YmyhZvFEtK/3ukssiM...(shortened)..." true
{
  "psbt": "cHNidP8BAFICAAAAAToM0DQ8jmnWtJHOCgSVu0Gzv1YmyhZvFEtK/3ukssiM...(shortened)...",
  "complete": true,
  "hex": "020000000001013a0cd0343c8e69d6b491ce0a0495bb41b3bf5626ca166f144b4aff7ba4b2c88c0100000000fdffffff0148260000000000001600148dee682cdfcef9b641ca61f0833927d3d3ab9896024730440220708bf414673d06837024b38300527ed89243504e98fb4645b76beb8c9f8d6298022010185c548463c3fabf475dc758e620dc46b83d6fe28fe6c34b80cf10f3dd72fb01282103a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79ad03742304b174230400"
}
```

We finalize the PSBT:

```bash
bitcoin-cli -datadir="." finalizepsbt "cHNidP8BAFICAAAAAToM0DQ8jmnWtJHOCgSVu0Gzv1YmyhZvFEtK/3ukssiM...(shortened)..."
{
  "hex": "020000000001013a0cd0343c8e69d6b491ce0a0495bb41b3bf5626ca166f144b4aff7ba4b2c88c0100000000fdffffff0148260000000000001600148dee682cdfcef9b641ca61f0833927d3d3ab9896024730440220708bf414673d06837024b38300527ed89243504e98fb4645b76beb8c9f8d6298022010185c548463c3fabf475dc758e620dc46b83d6fe28fe6c34b80cf10f3dd72fb01282103a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79ad03742304b174230400",
  "complete": true
}
```

And we send it:

```bash
bitcoin-cli -datadir="." sendrawtransaction "020000000001013a0cd0343c8e69d6b491ce0a0495bb41b3bf5626ca166f144b4aff7ba4b2c88c0100000000fdffffff0148260000000000001600148dee682cdfcef9b641ca61f0833927d3d3ab9896024730440220708bf414673d06837024b38300527ed89243504e98fb4645b76beb8c9f8d6298022010185c548463c3fabf475dc758e620dc46b83d6fe28fe6c34b80cf10f3dd72fb01282103a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79ad03742304b174230400"
error code: -26
error message:
non-final
```

Notice that it errors out. The `non-final` message indicates that this transaction cannot yet be accepted into the mempool.

We wait for the block height to pass `271220` and send it again:

```bash
bitcoin-cli -datadir="." getblockcount
271227

bitcoin-cli -datadir="." sendrawtransaction "020000000001013a0cd0343c8e69d6b491ce0a0495bb41b3bf5626ca166f144b4aff7ba4b2c88c0100000000fdffffff0148260000000000001600148dee682cdfcef9b641ca61f0833927d3d3ab9896024730440220708bf414673d06837024b38300527ed89243504e98fb4645b76beb8c9f8d6298022010185c548463c3fabf475dc758e620dc46b83d6fe28fe6c34b80cf10f3dd72fb01282103a63fe04543a8e2ca0194ba811ae076eb350c0708f5e08925db020a59bbbecf79ad03742304b174230400"
e2b64a372d5bab18658f5ce14bc27cd6c502c7026b8bc5853462c254638603b1
```

---

Throughout this article, we saw how to move beyond the basic "send and sign" to build **well-structured and more secure** transactions in Bitcoin Core.

**PSBT** separates responsibilities (create, sign, finalize), enabling collaborative workflows and offline environments; **multisig (m-of-n)** adds resilience against key loss and compromise; and **timelocks**, both **nLockTime** (in the transaction) and **CLTV/CSV** (in the script, via Miniscript), let you enforce **when** a UTXO can be spent. Together, these features form complementary layers: key policy (multisig), time policy (timelocks), and a secure transport format (PSBT). The result is a sending process that is **auditable, reproducible, and resistant to operational failures**, ready to evolve from the signet lab to professional day-to-day practice.