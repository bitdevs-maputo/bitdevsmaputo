---
layout: post
published: true
date: 2026-10-04
title: "How a Wallet Works in Bitcoin Core: Keys, Addresses, and UTXOs"
description: "Understand the inner workings of a Bitcoin Core wallet: the wallet.dat architecture, private key management, addresses, and UTXO tracking."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/bitcoin-wallet
---
## How a Wallet Works in Bitcoin Core: Keys, Addresses, and UTXOs

by Rafael Santos

In the Bitcoin universe, the wallet is the fundamental component for managing keys and addresses, allowing users to send, receive, and control their bitcoins securely. In Bitcoin Core, the wallet is a local file that stores your private keys and organizes your balances into UTXOs (unspent transaction outputs), functioning differently from online wallets or mobile apps that many people are accustomed to using. In this article, we will explore in a practical way how wallets work in Bitcoin Core, from creating keys and addresses to managing UTXOs, using real terminal commands and scripts.

In Bitcoin Core, the wallet is primarily represented by a file called **wallet.dat**, stored in the Bitcoin Core data directory (by default `~/.bitcoin/wallets/`). This file acts as a digital vault, securely holding all your private keys and essential information needed to control your bitcoins. It is worth remembering that the file does not store the coins themselves, but rather the keys that grant access to balances recorded on the blockchain.

You can easily create, load, and view different wallets using terminal commands. To create a new wallet named "MinhaCarteira", simply run:

```bash
bitcoin-cli -datadir="." createwallet "MinhaCarteira"
```

To view all wallets currently loaded in Bitcoin Core, use:

```bash
bitcoin-cli -datadir="." listwallets
```

Each wallet created has its own **wallet.dat**, allowing separate organization of keys and addresses. Thus, Bitcoin Core offers flexibility for anyone wishing to have multiple wallets, whether for different projects, distinct use cases, or varying security levels.

The `wallet.dat` is a database file in Berkeley DB format (a lightweight local database). It is not merely a "list of keys", but a vault that stores everything Bitcoin Core needs to manage your wallet. The primary elements recorded in `wallet.dat` are:

### 1. **Private keys**

- **Primary function of wallet.dat**: store your private keys.
- These keys are what "unlock" the bitcoins associated with addresses controlled by the wallet.

### 2. **Public keys and addresses**

- Public keys and addresses generated from the private keys are also stored for easy identification and use.

### 3. **Transaction metadata**

- The `wallet.dat` maintains information about received and sent transactions and their respective statuses (confirmed, unconfirmed, etc.).
- It also stores *labels*, notes, and timestamps.

### 4. **UTXOs controlled by the wallet**

- Although the balance itself is not directly "stored", the file maintains a reference to the UTXOs that belong to the wallet, enabling rapid calculation of the available balance.

### 5. **Scripts and used addresses**

- Custom payment scripts, previously used addresses, and auxiliary information for reconstructing transaction history.

### 6. **Wallet usage settings**

- Information regarding temporary locks, last used timestamp, internal accounts, and user preferences.

### 7. **Security data**

- If the wallet is encrypted, `wallet.dat` also stores the cryptographic key (protected by your passphrase).
- It also stores data about HD seeds (when available) and address derivation indexes (for HD wallets).

Remember that losing, corrupting, or exposing the `wallet.dat` file means compromising access to your bitcoins. In addition, opening, editing, or moving the file manually can also corrupt the data.

The **src/wallet** directory in the official Bitcoin Core repository contains all the fundamental code used to manage wallets—that is, for creating, loading, reading, writing, backing up, and restoring the `wallet.dat` file.

Inside it, some of the most relevant files include:

- **walletutil.cpp**: Where the default wallet file name (`wallet.dat`) is defined, among other utilities.
- **walletdb.cpp**: Responsible for managing the wallet database, including opening, reading, and writing `wallet.dat` using Berkeley DB.
- **wallet.cpp**: Implements core wallet logic, including operations such as restoring backups and loading the wallet into the system.

# Keys: Private, Public, and Seed Phrase

In Bitcoin, as in cryptography, everything begins with a key pair: the private key and the public key.

**Private key**: the absolute secret that allows spending the bitcoins associated with it.

**Public key**: derived from the private key; from it, we can generate the address you share to receive bitcoins.

In Bitcoin Core, every time you generate a new address, the software automatically creates a new private key and its corresponding public key.

Unlike many modern wallets, Bitcoin Core does not use the standard **BIP39 seed phrase** (the well-known 12 or 24 words). Instead, the entire set of keys and metadata is stored in the `wallet.dat` file. For this reason, backing up this file is essential to maintaining access to your funds.

To create a new address in your wallet and then view the corresponding private key, you can use:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" getnewaddress
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" dumpprivkey "endereço_gerado"
```

The first command creates a new address and associates it with an internal private key in your wallet. The second command displays the private key corresponding to the specified address.

**Note**: You can only use the `dumpprivkey` command on legacy wallets. For security reasons, this is not permitted on current wallets.

Warning: Never reveal your private key to anyone and never expose it on insecure machines or connections. Anyone with access to it can spend all the bitcoins held by that address.

In earlier versions of Bitcoin Core, creating a new address meant automatically generating a new key pair (private and public), which was securely stored in `wallet.dat`. Later came HD Wallets, which we will discuss in another article.

The main address types you can create in Bitcoin Core are:

- **Legacy (P2PKH)** — the oldest format, starts with `1`.
- **SegWit (P2SH)** — intermediate format, starts with `3`.
- **Native SegWit (bech32)** — modern format, starts with `bc1q`.
- **Taproot (bech32m)** — the latest version, starts with `bc1p` and enables advanced features such as Schnorr signatures.

To create addresses in Bitcoin Core, simply specify the type when using the `getnewaddress` command:

- **Legacy (P2PKH)**:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" getnewaddress "" "legacy"
```

- **SegWit (P2SH):**

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" getnewaddress "" "p2sh-segwit"
```

- **Native SegWit (bech32)**:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" getnewaddress "" "bech32"
```

- **Taproot (bech32m)**:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" getnewaddress "" "bech32m"
```

If you execute the four commands above, you will see that each address begins with a different prefix, identifying its type. These formats coexist on the Bitcoin network and can all be used to receive transactions, but SegWit and Taproot addresses offer lower fees and additional features.

# UTXO

Bitcoin uses the **UTXO model** (*Unspent Transaction Output*). Every time you receive bitcoins, you are actually receiving one or more **UTXOs**—"digital coins" recorded on the blockchain associated with an address you control. When you spend funds, you consume these UTXOs and, if there is change, new UTXOs are created for yourself.

To view all UTXOs in your Bitcoin Core wallet, you can use:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" listunspent
```

The result will be a list in JSON format. Each UTXO contains important fields, such as:

- **txid** – Unique identifier of the transaction that created that UTXO.
- **vout** – Output index within the transaction (`0`, `1`, etc.).
- **address** – The address that received the funds.
- **label** – Name or label assigned to the address (if any).
- **scriptPubKey** – Script defining how that UTXO can be spent.
- **amount** – Amount of bitcoin available in that UTXO.
- **confirmations** – Number of confirmations on the blockchain.
- **spendable** – Indicates whether the wallet can spend that UTXO.

Think of each UTXO as a physical coin: you can spend one or several at once to make a payment. The sum of all UTXOs is the actual balance of your wallet.

---

# In Practice

Now that we understand keys, addresses, and UTXOs, let's see how all this works in practice using Bitcoin Core. For testing purposes, we will use **signet**, allowing us to send and spend bitcoins without financial risk.

### **Receiving Bitcoin**

The first step is to generate an address in your wallet:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" getnewaddress
```

This command creates a new address (and the corresponding key pair) in your `wallet.dat`.

On **signet**, you can use *faucets* to receive test BTC.

---

### **Checking Your UTXOs**

After receiving bitcoins, list the available UTXOs:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" listunspent
```

The command will display each unspent output, with information such as `txid`, `vout`, `amount`, and `address`.

---

### **Spending Bitcoin**

To spend BTC, there are two ways. The first is creating a transaction where Bitcoin Core automatically selects the UTXOs (using `sendtoaddress`):

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" sendtoaddress "endereco_destino" 0.01
```

In the second option, we can have complete control over the UTXOs, building the transaction manually:

```bash
bitcoin-cli -datadir="." createrawtransaction \
'[{"txid":"<TXID_DO_UTXO>","vout":0}]' \
'{"endereco_destino":0.01,"endereco_troco":0.099}'
```

Afterwards, we must sign the transaction:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" signrawtransactionwithwallet "<hex_transacao>"
```

Finally, we broadcast it to the network:

```bash
bitcoin-cli -datadir="." sendrawtransaction "<hex_assinado>"
```

---

# Wallet Backup and Security

The `wallet.dat` file is the primary component of the wallet in Bitcoin Core. It contains all the private keys and information needed to spend your bitcoins. Therefore, **maintaining an up-to-date backup is essential**.

To create a backup of `wallet.dat`, use the command:

```bash
bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" backupwallet "caminho/backup_wallet.dat"
```

This backup can be saved to a USB flash drive, external hard drive, or even a cloud service **with strong encryption**.

**Important:** In Bitcoin Core, backing up `wallet.dat` is the only way to ensure you can recover access to your funds in the future. Unlike other wallets, it does not display a BIP39 seed phrase to write down—all the information needed to recreate your private keys resides inside `wallet.dat`. Losing this file (or the passphrase, if the wallet is encrypted) means permanently losing your bitcoins.

### Restoring a Wallet

To restore, simply replace the existing `wallet.dat` in the Bitcoin Core data directory with your backup file (while Bitcoin Core is shut down). Then, open Bitcoin Core and load the wallet normally.

If it is a new installation, simply place `wallet.dat` into the `wallets/` directory and start Bitcoin Core.

### Security for Developers and Node Operators

When developers or operators maintain `wallet.dat` on computers or servers, common security practices include:

- **Encrypt the wallet** with a strong passphrase:
    
    ```bash
    bitcoin-cli -datadir="." -rpcwallet="MinhaCarteira" encryptwallet "senha_muito_forte"
    ```
    
- **Use encrypted drives** (LUKS on Linux, BitLocker on Windows, FileVault on macOS).
- **Never leave wallet.dat exposed** on internet-connected servers without additional protection.
- **Control access permissions** on the system, ensuring that only authorized users can read the file.
- **Maintain offline backups** (cold storage), disconnected from the network, to avoid theft by malware.
- **Offline signing**: For large amounts, use an isolated (air-gapped) environment to sign transactions, keeping the private key away from connected computers.

An **air-gapped** setup with Bitcoin Core is a configuration where the machine that **holds the wallet with the private keys** never connects to the internet, acting as an "offline vault" to sign transactions with maximum security.

The idea is to separate the roles of **transaction creation/signing** and **network broadcast** across two computers:

- **Offline computer (air-gapped)** → Stores `wallet.dat` with the private keys and signs transactions. Never connects to the internet.
- **Online computer** → Connects to the Bitcoin network to sync blocks, create partially completed transactions, and broadcast them after signing.

These measures are critical because **anyone who obtains a copy of your `wallet.dat` will have full control over your bitcoins**.

---

Understanding how Bitcoin Core organizes and protects your private keys, addresses, and UTXOs is the first step toward mastering the safe and efficient use of the Bitcoin network. The logic is: the **wallet** holds your **keys**, the **keys** generate **addresses**, and the **addresses** control the **UTXOs** that represent your funds. This foundational knowledge is essential before moving on to more complex operations. In the next article in this series, we will explore in detail the **four address types in Bitcoin Core**, their characteristics, advantages, and when to use each one.

