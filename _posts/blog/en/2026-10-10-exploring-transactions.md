---
layout: post
published: true
date: 2026-10-10
title: "Exploring Transactions in Bitcoin Core"
description: "Understand the anatomy of a Bitcoin transaction: the UTXO model, inputs, outputs, network fees, and transaction value flows in Bitcoin Core."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/exploring-transactions
---
## Exploring Transactions in Bitcoin Core

by Rafael Santos

A Bitcoin transaction is the mechanism by which bitcoin is transferred between different addresses. A transaction consists of several essential components:

### **Components of a Bitcoin Transaction**

1. **Identification**
    - **TXID**: Unique transaction identifier (hash).
    - **Version**: Number specifying the transaction format rules.
2. **Inputs**
    - **Previous TXID**: Points to the transaction providing the funds.
    - **Index (vout)**: Output position within that previous transaction.
    - **ScriptSig / Witness**: Unlocking data proving ownership of the UTXO.
    - **Sequence**: Used for timelocks (nLockTime, RBF).
3. **Outputs**
    - **Value (satoshis)**: Amount of BTC transferred.
    - **ScriptPubKey**: Spending rules encumbering the output.
4. **Metadata**
    - **nLockTime**: Determines when the transaction can be included in a block.
    - **Size / vSize**: Transaction size in bytes / virtual size in vBytes (determines the fee required).
5. **Fee**
    - Calculated implicitly:
        
        ```bash
        Fee = Sum(inputs) - Sum(outputs)
        ```

Among these components, **Outputs** are fundamental. The **UTXO (Unspent Transaction Output) model** forms the architectural backbone of Bitcoin. Unlike traditional account-based systems where each account holds an aggregated balance, Bitcoin transactions create outputs that may or may not have been spent. A **UTXO** is an unspent transaction output that behaves like a digital banknote with a defined denomination. To make a payment, a user selects one or more existing UTXOs as inputs and creates new outputs directed to the recipients. If the combined value of the selected UTXOs exceeds the intended payment amount, the difference is returned to the user as change in a newly created UTXO, while the remainder between inputs and outputs serves as the mining fee.

Technically, each UTXO is uniquely identified by an **outpoint pair `(txid, vout)`**, where `txid` is the identifier of the transaction that created it and `vout` is the zero-based index of the output within that transaction. In addition to this identifier, a UTXO has two primary attributes: the **value** in satoshis (the amount of bitcoin represented) and the **scriptPubKey**, which specifies the spending conditions—typically requiring a digital signature matching a public key. When a UTXO is spent as an input in a new transaction, it is consumed and ceases to exist, giving rise to new outputs that become fresh UTXOs available for future transactions. This mechanism guarantees traceability across the entire network and prevents double-spending, since each UTXO can be spent exactly once.

Consequently, a user's Bitcoin **balance** is not explicitly recorded on the blockchain like an entry in a bank ledger. What we call a balance is actually the **aggregate sum of all UTXOs that belong to the user and can be unlocked** with their private keys. A Bitcoin wallet tracks this set of UTXOs associated with the user's addresses. Whenever a payment is made, specific UTXOs are spent and replaced by new ones, updating the user's spending power.

The diagram below illustrates the flow of transactions and their components.

![Transactions](../../assets/Artigo07-Transacoes.webp)

In the diagram, we see the relationship across three chained transactions. **Transaction 1** spends a 1.0 BTC UTXO and splits it into two outputs: 0.4 BTC and 0.5 BTC, paying a 0.1 BTC fee. **Transaction 2** consumes a 0.5 BTC UTXO, producing two new outputs of 0.3 BTC and 0.15 BTC, with a 0.05 BTC fee. **Transaction 3** illustrates UTXO composition: it combines the 0.5 BTC output from Transaction 1 and the 0.3 BTC output from Transaction 2 as inputs, totaling 0.8 BTC. It then creates two outputs of 0.6 BTC and 0.1 BTC, leaving 0.1 BTC as a fee. This chaining demonstrates how UTXOs propagate through transactions, being consumed and recreated continuously while preserving the consistency of the Bitcoin system.

To demonstrate this in practice, we can run a shell script that simulates this exact scenario. We will use the `regtest` network since we need complete control over initial UTXO generation (1.0 BTC and 0.5 BTC).

```bash
BASE_CLI='bitcoin-cli -datadir=.'
if ! $BASE_CLI listwallets | grep -q '"w"'; then
  $BASE_CLI createwallet "w" >/dev/null
fi
cli='bitcoin-cli -datadir=. -rpcwallet=w'
SEND_MAXFEERATE=0.9   # below 1 BTC/kvB to avoid rejection

# Mine base balance
MINER=$($cli getnewaddress)
$cli generatetoaddress 101 "$MINER" >/dev/null

# Create initial UTXOs: 1.0 BTC and 0.5 BTC
ADDR_1=$($cli getnewaddress)
ADDR_05=$($cli getnewaddress)
TXFUND1=$($cli sendtoaddress "$ADDR_1" 1.0)
TXFUND2=$($cli sendtoaddress "$ADDR_05" 0.5)
$cli generatetoaddress 1 "$MINER" >/dev/null

VOUT1=$($cli gettransaction "$TXFUND1" | jq -r --arg a "$ADDR_1" '.details[] | select(.address==$a and .category=="receive") | .vout' | head -n1)
VOUT05=$($cli gettransaction "$TXFUND2" | jq -r --arg a "$ADDR_05" '.details[] | select(.address==$a and .category=="receive") | .vout' | head -n1)

echo "== Initial UTXOs =="
echo "1.0 BTC  -> $TXFUND1:$VOUT1"
echo "0.5 BTC  -> $TXFUND2:$VOUT05"
echo

# Destination addresses
C=$($cli getnewaddress)   # 0.4
D=$($cli getnewaddress)   # 0.5
E=$($cli getnewaddress)   # 0.3
F=$($cli getnewaddress)   # 0.15
G=$($cli getnewaddress)   # 0.6
H=$($cli getnewaddress)   # 0.1

########################################
# Tx1: 1.0 -> 0.4 + 0.5  (fee = 0.1)
########################################
RAW1=$($cli createrawtransaction "[{\"txid\":\"$TXFUND1\",\"vout\":$VOUT1}]" "{\"$C\":0.4, \"$D\":0.5}")
HEX1=$($cli signrawtransactionwithwallet "$RAW1" | jq -r .hex)
TX1=$($cli sendrawtransaction "$HEX1" $SEND_MAXFEERATE)
$cli generatetoaddress 1 "$MINER" >/dev/null
echo "Tx1: $TX1"

VOUT_04=$($cli gettransaction "$TX1" | jq -r --arg a "$C" '.details[] | select(.address==$a and .category=="receive") | .vout' | head -n1)
VOUT_05_FROM_TX1=$($cli gettransaction "$TX1" | jq -r --arg a "$D" '.details[] | select(.address==$a and .category=="receive") | .vout' | head -n1)

########################################
# Tx2: 0.5 -> 0.3 + 0.15  (fee = 0.05)
########################################
RAW2=$($cli createrawtransaction "[{\"txid\":\"$TXFUND2\",\"vout\":$VOUT05}]" "{\"$E\":0.3, \"$F\":0.15}")
HEX2=$($cli signrawtransactionwithwallet "$RAW2" | jq -r .hex)
TX2=$($cli sendrawtransaction "$HEX2" $SEND_MAXFEERATE)
$cli generatetoaddress 1 "$MINER" >/dev/null
echo "Tx2: $TX2"

VOUT_03=$($cli gettransaction "$TX2" | jq -r --arg a "$E" '.details[] | select(.address==$a and .category=="receive") | .vout' | head -n1)

########################################
# Tx3: (0.5 from Tx1) + (0.3 from Tx2) -> 0.6 + 0.1 (fee = 0.1)
########################################
RAW3=$($cli createrawtransaction \
  "[{\"txid\":\"$TX1\",\"vout\":$VOUT_05_FROM_TX1},{\"txid\":\"$TX2\",\"vout\":$VOUT_03}]" \
  "{\"$G\":0.6, \"$H\":0.1}")
HEX3=$($cli signrawtransactionwithwallet "$RAW3" | jq -r .hex)
TX3=$($cli sendrawtransaction "$HEX3" $SEND_MAXFEERATE)
$cli generatetoaddress 1 "$MINER" >/dev/null
echo "Tx3: $TX3"
echo

########################################
# Simple transaction summary
########################################
echo
echo "==================== SUMMARY ===================="

echo "-- Tx1 ($TX1)"
echo "Inputs:"
$cli decoderawtransaction "$HEX1" | jq -r '.vin[] | "  - \(.txid):\(.vout)"'
echo "Outputs:"
$cli decoderawtransaction "$HEX1" | jq -r '.vout[] | "  - \(.value) BTC -> \(.scriptPubKey.address)"'
echo -n "Fee: "
$cli gettransaction "$TX1" | jq -r '.fee'
echo

echo "-- Tx2 ($TX2)"
echo "Inputs:"
$cli decoderawtransaction "$HEX2" | jq -r '.vin[] | "  - \(.txid):\(.vout)"'
echo "Outputs:"
$cli decoderawtransaction "$HEX2" | jq -r '.vout[] | "  - \(.value) BTC -> \(.scriptPubKey.address)"'
echo -n "Fee: "
$cli gettransaction "$TX2" | jq -r '.fee'
echo

echo "-- Tx3 ($TX3)"
echo "Inputs:"
$cli decoderawtransaction "$HEX3" | jq -r '.vin[] | "  - \(.txid):\(.vout)"'
echo "Outputs:"
$cli decoderawtransaction "$HEX3" | jq -r '.vout[] | "  - \(.value) BTC -> \(.scriptPubKey.address)"'
echo -n "Fee: "
$cli gettransaction "$TX3" | jq -r '.fee'
echo "==============================================="
```

Breaking down each section of the script...

### 1. Environment Setup

Before creating transactions, the script sets up a Bitcoin Core test environment (`regtest`), initializes a wallet, and generates spendable coins.

```bash
BASE_CLI='bitcoin-cli -datadir=.'
if ! $BASE_CLI listwallets | grep -q '"w"'; then
  $BASE_CLI createwallet "w" >/dev/null
fi

cli='bitcoin-cli -datadir=. -rpcwallet=w'
SEND_MAXFEERATE=0.9   # below 1 BTC/kvB to avoid rejection

# Mine base balance
MINER=$($cli getnewaddress)
$cli generatetoaddress 101 "$MINER" >/dev/null
```

Here we ensure a wallet named `w` exists, connect to it, and mine blocks so spendable coinbase outputs mature.

### 2. Creating Initial UTXOs

The next step creates two distinct outputs (UTXOs): one of 1.0 BTC and one of 0.5 BTC.

```bash
# Create initial UTXOs: 1.0 BTC and 0.5 BTC
ADDR_1=$($cli getnewaddress)
ADDR_05=$($cli getnewaddress)
TXFUND1=$($cli sendtoaddress "$ADDR_1" 1.0)
TXFUND2=$($cli sendtoaddress "$ADDR_05" 0.5)
$cli generatetoaddress 1 "$MINER" >/dev/null
```

This is equivalent to receiving two separate digital banknotes that will subsequently be spent across our transactions.

### 3. Transaction 1 (Tx1)

In this transaction, we spend the 1.0 BTC UTXO and create two new outputs: 0.4 BTC and 0.5 BTC, paying a 0.1 BTC network fee.

```bash
# Tx1: 1.0 -> 0.4 + 0.5  (fee = 0.1)
RAW1=$($cli createrawtransaction "[{\"txid\":\"$TXFUND1\",\"vout\":$VOUT1}]" "{\"$C\":0.4, \"$D\":0.5}")
HEX1=$($cli signrawtransactionwithwallet "$RAW1" | jq -r .hex)
TX1=$($cli sendrawtransaction "$HEX1" $SEND_MAXFEERATE)
$cli generatetoaddress 1 "$MINER" >/dev/null
```

This demonstrates how a single UTXO can be divided into multiple smaller UTXOs.

### 4. Transaction 2 (Tx2)

Here, we take the 0.5 BTC UTXO created at the start and split it into 0.3 BTC and 0.15 BTC, paying a 0.05 BTC fee.

```bash
# Tx2: 0.5 -> 0.3 + 0.15  (fee = 0.05)
RAW2=$($cli createrawtransaction "[{\"txid\":\"$TXFUND2\",\"vout\":$VOUT05}]" "{\"$E\":0.3, \"$F\":0.15}")
HEX2=$($cli signrawtransactionwithwallet "$RAW2" | jq -r .hex)
TX2=$($cli sendrawtransaction "$HEX2" $SEND_MAXFEERATE)
$cli generatetoaddress 1 "$MINER" >/dev/null
```

### 5. Transaction 3 (Tx3)

Finally, we combine two distinct UTXOs (the 0.5 BTC output from Tx1 and the 0.3 BTC output from Tx2) into a single transaction with multiple inputs. The combined total (0.8 BTC) is spent across two outputs (0.6 BTC and 0.1 BTC), leaving 0.1 BTC for the fee.

```bash
# Tx3: (0.5 from Tx1) + (0.3 from Tx2) -> 0.6 + 0.1 (fee = 0.1)
RAW3=$($cli createrawtransaction \
  "[{\"txid\":\"$TX1\",\"vout\":$VOUT_05_FROM_TX1},{\"txid\":\"$TX2\",\"vout\":$VOUT_03}]" \
  "{\"$G\":0.6, \"$H\":0.1}")
HEX3=$($cli signrawtransactionwithwallet "$RAW3" | jq -r .hex)
TX3=$($cli sendrawtransaction "$HEX3" $SEND_MAXFEERATE)
$cli generatetoaddress 1 "$MINER" >/dev/null
```

This highlights a core capability of the UTXO model: inputs from completely different transactions can be aggregated into a single spending transaction.

### 6. Final Summary

Finally, the script outputs a breakdown of each transaction, displaying inputs, outputs, and fees.

```bash
echo "-- Tx1 ($TX1)"
echo "Inputs:"
$cli decoderawtransaction "$HEX1" | jq -r '.vin[] | "  - \(.txid):\(.vout)"'
echo "Outputs:"
$cli decoderawtransaction "$HEX1" | jq -r '.vout[] | "  - \(.value) BTC -> \(.scriptPubKey.address)"'
echo -n "Fee: "
$cli gettransaction "$TX1" | jq -r '.fee'
```

This summary illustrates the **flow of value** and confirms how fees are calculated as the difference between total inputs and total outputs.

Next, let's explore the different methods Bitcoin Core provides for creating and broadcasting transactions.

## Methods for Creating Transactions in Bitcoin Core

Bitcoin Core provides different levels of abstraction for creating transactions, ranging from automated high-level commands to fully manual workflows.

### 1. High-Level Automated Transfers

The **simplest method** is using high-level commands such as `sendtoaddress` or `sendmany`. Here, the user specifies only the destination address and amount (or multiple destinations with `sendmany`), and Bitcoin Core handles everything else automatically: coin selection from available wallet UTXOs, change output creation, fee estimation, signing, and network broadcast. This is the standard method for everyday wallet usage:

```bash
bitcoin-cli -datadir="." -rpcwallet=w   sendtoaddress bcrt1qszaegaf7drfa9kfql057jle78yd8ukhrhfr9lx 0.1
44e204c91a032e05b075960977ef79219e706ef720096d86dc562f86ec775244
```

```bash
bitcoin-cli -datadir="." -rpcwallet=w \
  sendmany "" '{"bcrt1qrpruxdtawnxtqtugsar2yglvr2xf50kd7rkau2":0.2, "bcrt1qxt6ujulks2es4wcfz5emdeklyj23ccrdqwagx5":0.3}'
896f5d684cabe6ee28ef78d0d97d0f5deaa88471df563f4223fcef206a4bdd96
```

For both `sendtoaddress` and `sendmany`, the **command returns the TXID of the created and broadcasted transaction**.

### 2. Manual Raw Transactions

At the **lowest level**, we have the construction of **raw transactions**, as demonstrated earlier in this article. In this workflow, the user takes full responsibility: explicitly specifying which UTXOs to spend as inputs, which addresses receive outputs, the exact change amount, and implicitly, the mining fee. The transaction is built with `createrawtransaction`, signed with `signrawtransactionwithwallet`, and broadcast with `sendrawtransaction`. While more involved, this method grants total control and is crucial for educational experimentation, auditing, and advanced multi-signature or customized script setups.

The following example demonstrates spending a **0.15 BTC** UTXO to send **0.14 BTC** to a destination address, leaving the difference (0.01 BTC) as the mining fee.

**a. Construct the transaction**

Select the `txid` and `vout` of the UTXO to spend and define the recipient address and value:

```bash
bitcoin-cli -datadir=. -rpcwallet=w createrawtransaction \
  '[{"txid":"ac6c1f851d4e669dcb3d6fceddbc6e4a5b38e4905887d5dc98a14e9b2c6bccf7","vout":1}]' \
  '{"bcrt1qqjj4dkz96a68fuwhr7uwstjm5w67lgzdag9yvq":0.14}'
0200000001f7cc6b2c9b4ea198dcd5875890e4385b4a6ebcddce6f3dcb9d664e1d851f6cac0100000000fdffffff01809fd5000000000016001404a556d845d77474f1d71fb8e82e5ba3b5efa04d00000000
```

This returns the **raw hexadecimal string** (unsigned), representing the serialized transaction.

---

**b. Sign the transaction**

Next, pass the raw hex to the wallet's signing command, which attaches the required cryptographic signatures:

```bash
bitcoin-cli -datadir=. -rpcwallet=w signrawtransactionwithwallet "0200000001f7cc6b2c9b4ea198dcd5875890e4385b4a6ebcddce6f3dcb9d664e1d851f6cac0100000000fdffffff01809fd5000000000016001404a556d845d77474f1d71fb8e82e5ba3b5efa04d02473044022046247b465a431eff64eee143d9d730ef58189d940fad575ff1809d72c00657a102205f22a7951bfa7ab690cf8cdbaf67fddef32402be39fd3a06b1f6e58a59f4e1e60121033be379dcb5d80de0c7c64fa09845497aee5c5489603bd727a4f5670d13e39d8200000000"
{
  "hex": "02000000000101f7cc6b2c9b4ea198dcd5875890e4385b4a6ebcddce6f3dcb9d664e1d851f6cac0100000000fdffffff01809fd5000000000016001404a556d845d77474f1d71fb8e82e5ba3b5efa04d02473044022046247b465a431eff64eee143d9d730ef58189d940fad575ff1809d72c00657a102205f22a7951bfa7ab690cf8cdbaf67fddef32402be39fd3a06b1f6e58a59f4e1e60121033be379dcb5d80de0c7c64fa09845497aee5c5489603bd727a4f5670d13e39d8200000000",
  "complete": true
}
```

The output contains the updated **signed hex** (under `"hex"`) and `"complete": true`, indicating all inputs have been successfully signed and the transaction is valid for broadcast.

---

**c. Broadcast the transaction**

Finally, transmit the signed transaction to the network:

```bash
bitcoin-cli -datadir=. -rpcwallet=w sendrawtransaction "02000000000101f7cc6b2c9b4ea198dcd5875890e4385b4a6ebcddce6f3dcb9d664e1d851f6cac0100000000fdffffff01809fd5000000000016001404a556d845d77474f1d71fb8e82e5ba3b5efa04d02473044022046247b465a431eff64eee143d9d730ef58189d940fad575ff1809d72c00657a102205f22a7951bfa7ab690cf8cdbaf67fddef32402be39fd3a06b1f6e58a59f4e1e60121033be379dcb5d80de0c7c64fa09845497aee5c5489603bd727a4f5670d13e39d8200000000"
c3768db0ffcaa902539e8e4a9498de0588cefce865510c54aa4502da6aa18461
```

The command returns the transaction's **TXID**.

**Important note**: The commands above should be run using the **hexadecimal values produced in your own environment**. Each invocation of `createrawtransaction` and `signrawtransactionwithwallet` produces different hex outputs depending on the specific UTXOs and keys used.

### 3. Semi-Automated Raw Transactions

There is also an intermediate approach that combines manual control with automated coin selection:

**Construct the transaction WITHOUT inputs (only recipient(s) and amounts).**

```bash
bitcoin-cli -datadir=. -rpcwallet=w \
  createrawtransaction '[]' \
  '{"bcrt1qva34k0dzqwsaezxxhk2dzt2gqh9mh7rff9djda":0.42}'
02000000000180de80020000000016001467635b3da203a1dc88c6bd94d12d4805cbbbf86900000000
```

This returns an unsigned **raw hex** that will be passed to the next step.

**Let Bitcoin Core fund the transaction (select UTXOs, create change, and estimate fee)**

```bash
bitcoin-cli -datadir=. -rpcwallet=w \
  fundrawtransaction 02000000000180de80020000000016001467635b3da203a1dc88c6bd94d12d4805cbbbf86900000000
{
  "hex": "02000000023d94159e98322b8c910a11b417c60b32baf9d937962c14b077414a6af2deb2870000000000fdffffff136595a2f0ddb78ce8cf87015794fc493f4f20c53080109a932ab95a1f18b8ee0100000000fdffffff0280de80020000000016001467635b3da203a1dc88c6bd94d12d4805cbbbf8692055c600000000001600142fc983585f862be671f4718497b9f95445afac9100000000",
  "fee": 0.00002080,
  "changepos": 1
}
```

The output contains a JSON object with:

- `"hex"` → The **funded raw hex** (populated with inputs and change output);
- `"fee"` → Estimated transaction fee;
- `"changepos"` → Position index of the change output (or -1 if none was created).

The "hex" field value is passed directly to the signing step.

**Sign with wallet keys**

```bash
bitcoin-cli -datadir=. -rpcwallet=w \
  signrawtransactionwithwallet 02000000023d94159e98322b8c910a11b417c60b32baf9d937962c14b077414a6af2deb2870000000000fdffffff136595a2f0ddb78ce8cf87015794fc493f4f20c53080109a932ab95a1f18b8ee0100000000fdffffff0280de80020000000016001467635b3da203a1dc88c6bd94d12d4805cbbbf8692055c600000000001600142fc983585f862be671f4718497b9f95445afac9102473044022015c881a9f666221593e0b01f134ee231bed33d45ad4fe100da0e8c694c69d8eb02207ec43229fb1932b7f2ae1a59fb241f4d6f9a525e36a51744600cb96aea98466101210229b43fc50701cfabbe3db369a715ee63156eaa2036c9b9d3f452310c751ffec202473044022020d22099a9e0a398313b562c631e1378c0398500cec3281d70f11ef44ce9024602200ce77f7d3c1e7bc84ea52611098b882feed948cf77b0c5fc54db619a94f6bdc8012102e03cddcc5d13d4a5e906d1a21710d0945b01296f343e77125fe4bd7f46c8149700000000
{
  "hex": "020000000001023d94159e98322b8c910a11b417c60b32baf9d937962c14b077414a6af2deb2870000000000fdffffff136595a2f0ddb78ce8cf87015794fc493f4f20c53080109a932ab95a1f18b8ee0100000000fdffffff0280de80020000000016001467635b3da203a1dc88c6bd94d12d4805cbbbf8692055c600000000001600142fc983585f862be671f4718497b9f95445afac9102473044022015c881a9f666221593e0b01f134ee231bed33d45ad4fe100da0e8c694c69d8eb02207ec43229fb1932b7f2ae1a59fb241f4d6f9a525e36a51744600cb96aea98466101210229b43fc50701cfabbe3db369a715ee63156eaa2036c9b9d3f452310c751ffec202473044022020d22099a9e0a398313b562c631e1378c0398500cec3281d70f11ef44ce9024602200ce77f7d3c1e7bc84ea52611098b882feed948cf77b0c5fc54db619a94f6bdc8012102e03cddcc5d13d4a5e906d1a21710d0945b01296f343e77125fe4bd7f46c8149700000000",
  "complete": true
}
```

The `"hex"` field provides the signed transaction, ready for broadcast.

**Broadcast to the network**

```bash
bitcoin-cli -datadir=. -rpcwallet=w \
  sendrawtransaction 020000000001023d94159e98322b8c910a11b417c60b32baf9d937962c14b077414a6af2deb2870000000000fdffffff136595a2f0ddb78ce8cf87015794fc493f4f20c53080109a932ab95a1f18b8ee0100000000fdffffff0280de80020000000016001467635b3da203a1dc88c6bd94d12d4805cbbbf8692055c600000000001600142fc983585f862be671f4718497b9f95445afac9102473044022015c881a9f666221593e0b01f134ee231bed33d45ad4fe100da0e8c694c69d8eb02207ec43229fb1932b7f2ae1a59fb241f4d6f9a525e36a51744600cb96aea98466101210229b43fc50701cfabbe3db369a715ee63156eaa2036c9b9d3f452310c751ffec202473044022020d22099a9e0a398313b562c631e1378c0398500cec3281d70f11ef44ce9024602200ce77f7d3c1e7bc84ea52611098b882feed948cf77b0c5fc54db619a94f6bdc8012102e03cddcc5d13d4a5e906d1a21710d0945b01296f343e77125fe4bd7f46c8149700000000
200e8803b8e081e6ef96d546af2d943f457720b3dd973fe25421b24cecbb1104
```

The `sendrawtransaction` command transmits the transaction to connected peers and returns its **TXID**.

---

In this article, we examined in practice how Bitcoin transactions are constructed, from the fundamental UTXO model to creating both simple and composite transactions in **Bitcoin Core**. We explored automated transfers via high-level commands as well as the fine-grained, manual workflow of building raw transactions—where the user specifies every detail: inputs, outputs, change, and fees.

This hands-on walkthrough demonstrates how the UTXO model underpins Bitcoin's transparency and security, allowing every satoshi to be traced back to its creation. It also illustrates how beneath a seemingly simple payment lies a robust set of cryptographic and structural rules that enforce transaction validity and immutability.

In upcoming articles, we will dive deeper into core concepts such as:

- The mechanics of **ScriptPubKey** and **ScriptSig/Witness**, which form the foundation of Bitcoin's spending validation script system.
- **Tracking transactions in the mempool**, analyzing how transactions propagate across network nodes before being confirmed in blocks.

These topics will provide an even deeper look into how Bitcoin secures value transfers and how every node on the network validates each transaction.

---
