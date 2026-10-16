---
layout: post
published: true
date: 2026-10-06
title: "Exploring Address Types in Bitcoin Core (Part 1): Legacy"
description: "Learn the history and mechanics of Legacy Bitcoin addresses (P2PK and P2PKH), scriptPubKey rules, and practical examples using the CLI and Python."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/bitcoin-addresses
---
## Exploring Address Types in Bitcoin Core (Part 1): Legacy

by Rafael Santos

Understanding the different Bitcoin address types requires knowing a bit of blockchain history. In this article, I will present a more theoretical foundation to understand why different address formats exist and how they work. Later, we will use Bitcoin Core's `bitcoin-cli`, `bash`, and `Python` to see practical examples and scripts running on Signet.

In Bitcoin, **addresses do not appear out of thin air;** they are derived from a **public key**, which in turn is generated from a **private key**, as we saw in the previous article. This cryptographic chain is what ensures that only the holder of the private key can spend the bitcoins sent to a given address.

In the early days of the network, during roughly the first 200 blocks, most mined bitcoins were paid directly to a public key. For this reason, it was called **P2PK** (*Pay to Public Key*).

Shortly thereafter, the P2PK model was succeeded by **P2PKH** (*Pay to Public Key Hash*), in which payment is made to the hash of the public key. This transition brought two major advantages:

1. **Privacy** – The public key is only revealed when the output is spent, not when it is created.
2. **Future security** – If elliptic curve cryptography were ever broken, bitcoins sent to P2PKH would remain protected until spent, unlike P2PK.

**Important:** From the beginning, every Bitcoin transaction has always involved executing a script to define the spending rules. In the earliest formats, such as P2PK, the script was extremely simple—essentially "pay to this public key". Over time, it grew more sophisticated, enabling payments to the hash of a public key, concealing complex conditions, and even combining multiple spending rules.

In Bitcoin, each **output** contains a `scriptPubKey`, the "locking script" or contract defining how it can be spent. To spend this output, the recipient must provide a `scriptSig` (or, in SegWit, the *witness data*) that satisfies this contract. These two scripts are evaluated by Bitcoin's **script engine**, which validates whether the spending conditions have been met. Later, in another article, we will see how this script engine works; for now, we can abstract this detail.

**This progression from P2PK to P2PKH** marked the adoption of the **Legacy** address format with prefix `1` (on mainnet). The process to create a P2PKH address follows a well-defined workflow:

1. **Generate a random private key** (256 bits).
2. **Calculate the public key** via ECDSA (*secp256k1*).
3. Apply **SHA-256** and then **RIPEMD-160** to the public key, producing a **hash160** (20 bytes).
4. Prefix this hash with the **version byte** `0x00` (for mainnet) and calculate a **checksum** (double SHA-256, 4 bytes).
5. Encode everything in **Base58Check**, resulting in an address that starts with `1`.
6. Place this hash in the UTXO's `scriptPubKey`:
    
    ```
    OP_DUP OP_HASH160 <hash160(pubkey)> OP_EQUALVERIFY OP_CHECKSIG
    ```
    
    Thus, only someone holding the private key capable of generating that public key can spend the funds.
    
    **Note 1:** For other networks (testnet, signet, and regtest), only the version prefix changes, resulting in addresses that start with `m` or `n`.
    
    **Note 2:** Although we can abstract the implementation of these algorithms to understand the overall process, it is useful to know the broad role of each:
    
    - **ECDSA (secp256k1):** Generates public keys from private keys using elliptic curves.
    - **SHA-256:** Cryptographic hash function producing 256 bits of output.
    - **RIPEMD-160:** 160-bit hash function used alongside SHA-256 to compose the public key hash.
    - **Base58Check:** Encoding scheme with a reduced alphabet and checksum to prevent typographical errors.
    
    For educational purposes, we can compare the address generated directly by Bitcoin Core with this manual address creation process. In Bitcoin Core, we can create an address in a wallet and easily retrieve the private key using the script below:
    
    ```bash
    # create/load LEGACY wallet (BDB), generate P2PKH address and display WIF
    # Wallet: if already loaded, proceed; otherwise try to load; if it does not exist, create (LEGACY)
    if ! bitcoin-cli -datadir="." -signet -rpcwallet=demo-legacy getwalletinfo >/dev/null 2>&1; then
      if ! bitcoin-cli -datadir="." -signet loadwallet "demo-legacy" >/dev/null 2>&1; then
        bitcoin-cli -datadir="." -signet createwallet "demo-legacy" false false "" false false true false >/dev/null
      fi
    fi
    # Address
    ADDR=$(bitcoin-cli -datadir="." -signet -rpcwallet=demo-legacy getnewaddress "" legacy)
    echo "Address 	= ${ADDR}"
    # Info
    INFO=$(bitcoin-cli -datadir="." -signet -rpcwallet=demo-legacy getaddressinfo "${ADDR}")
    #echo "spk=$(echo "$INFO" | jq -r .scriptPubKey)"
    echo "Public key 	= $(echo "$INFO" | jq -r .pubkey)"
    # WIF
    WIF=$(bitcoin-cli -datadir="." -signet -rpcwallet=demo-legacy dumpprivkey "${ADDR}")
    echo "Private key (wif) 	= ${WIF}"
    ```
    
    Important: In modern **Bitcoin Core** (since version 0.21), a major change occurred:
    
    ### Before (prior to 0.21)
    
    - Wallets were based on **Berkeley DB (BDB)**.
    - These are known as **legacy wallets** (they do not use descriptors).
    - They allow `dumpprivkey` to easily export the private key.
    
    ### Now (since 0.21)
    
    - Bitcoin Core migrated to **Descriptor Wallets** (SQLite).
    - They are more secure, better organized, and support complex scripts (SegWit, Taproot, etc.).
    - However, they **do not directly support** certain legacy RPCs, such as `dumpprivkey`.
    
    To create a legacy BDB wallet, `bitcoind` must be started with `-deprecatedrpc=create_bdb`:
    
    ```bash
    bitcoind -datadir="." -daemon -deprecatedrpc=create_bdb
    ```
    
    Running the previous script, we obtain:
    
    ```bash
    ./cria_endereco_e_pega_chave_privada.sh
    Address 	 = mz4fq4uwAaHQjGszvtV65DxuMLk8bWXafD
    Public key 	 = 03bfd3218ca0a09183062a8f0ef0b238f726e88fc78b19846e150d065f104a3e03
    Private key (wif) 	= cV5dB3YUbKfuuRbmp7yKbf6sM4cDQE5jTk96kSfvEeS6obdDJean
    ```
    
    Explaining the code: After creating or loading the wallet, the `getnewaddress` command of `bitcoin-cli` is used to generate a new legacy address in the wallet. Finally, the `dumpprivkey` command retrieves the private key corresponding to that address.
    
    Now, starting from the obtained private key, we can reconstruct the address "by hand" and compare it with the address provided by Bitcoin Core. The first step is to **calculate the public key** via ECDSA (*secp256k1*). The script below performs this calculation and displays the corresponding public key:
    
    ```bash
    # Usage:
    #   ./calcular_chave_publica.sh <WIF>
    #   ./calcular_chave_publica.sh --hex <priv_hex32>
    
    if [[ $# -lt 1 ]]; then
      echo "Usage: $0 <WIF> | --hex <priv_hex32>" >&2
      exit 1
    fi
    
    MODE="wif"; INPUT="$1"; shift || true
    if [[ "$INPUT" == "--hex" ]]; then
      MODE="hex"; INPUT="${1:-}"; shift || true
    fi
    
    python3 - "$MODE" "$INPUT" <<'PY'
    import sys, hashlib
    
    # --- Base58Check (decode) ---
    ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    def b58decode(s: str) -> bytes:
        n = 0
        for c in s.encode():
            n = n*58 + ALPHABET.index(c)
        full = n.to_bytes((n.bit_length()+7)//8, 'big')
        z = len(s) - len(s.lstrip('1'))
        return b'\x00'*z + full
    def b58decode_check(s: str) -> bytes:
        full = b58decode(s)
        if len(full) < 4: raise ValueError('b58 too short')
        payload, checksum = full[:-4], full[-4:]
        chk = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]
        if chk != checksum: raise ValueError('bad checksum')
        return payload
    
    mode, val = sys.argv[1], sys.argv[2]
    
    # --- private key (32 bytes) ---
    if mode == 'wif':
        payload = b58decode_check(val)
        version = payload[0]
        compressed_flag = (len(payload) == 34 and payload[33] == 0x01)
        priv = payload[1:33]
        net = 'mainnet' if version == 0x80 else ('testnet/signet' if version == 0xEF else f'0x{version:02x}')
    else:
        priv = bytes.fromhex(val)
        if len(priv) != 32:
            raise SystemExit('[fail] --hex needs 32 bytes (64 hex)')
        compressed_flag = True
        net = '(hex)'
    
    try:
        from ecdsa import SigningKey, SECP256k1
    except Exception:
        raise SystemExit("[fail] 'ecdsa' missing. Install: pip install ecdsa")
    
    sk = SigningKey.from_string(priv, curve=SECP256k1)
    vk = sk.verifying_key
    x, y = vk.pubkey.point.x(), vk.pubkey.point.y()
    
    pub_c = (b"\x02" if (y % 2 == 0) else b"\x03") + x.to_bytes(32, 'big')
    pub_u = b"\x04" + x.to_bytes(32, 'big') + y.to_bytes(32, 'big')
    
    print(f"PrivKey (hex) : {priv.hex()}")
    print(f"PubKey (compr): {pub_c.hex()}")
    print(f"PubKey (full) : {pub_u.hex()}")
    PY
    ```
    
    Notice that we did not use Bitcoin Core in this script, only Bash and Python. We do not need to dive deeply into the underlying algorithms right now, but at a high level, what this script does is:
    
    ```bash
    1. Input → parses parameters (WIF format or --hex).
    2. Decoding → converts WIF/hex into raw private key (32 bytes).
    3. Calculation (ECDSA) → from private key, derives public point (x, y).
    4. Formatting → constructs compressed and uncompressed public keys.
    5. Output → prints private key (hex) and public keys.
    ```
    
    Below we see the script running and its results:
    
    ```bash
    ./calcula_chave_publica.sh cV5dB3YUbKfuuRbmp7yKbf6sM4cDQE5jTk96kSfvEeS6obdDJean
    PrivKey (hex) : dfbda42d8bf50677dcd9e2e689ac6aec9247e81e674d62116bc4c3ce3af57036
    PubKey (compr): 03bfd3218ca0a09183062a8f0ef0b238f726e88fc78b19846e150d065f104a3e03
    PubKey (full) : 04bfd3218ca0a09183062a8f0ef0b238f726e88fc78b19846e150d065f104a3e039d1a05c776bdf79540d7f095bd7d8a05464d8a1699ef8d311805a748a25f2f7f
    ```
    
    Note that the script outputs both the compressed public key (the standard) and the uncompressed (full) public key. Once the public key is calculated, we can move on to the final step: address reconstruction:
    
    ```bash
    # Usage:
    #   ./reconstruir_endereco_p2pkh_clean.sh <pubkey_hex>
    # Output: PubKey, hash160, scriptPubKey, Address (testnet/signet)
    
    if [[ $# -lt 1 ]]; then
      echo "Usage: $0 <pubkey_hex>" >&2
      exit 1
    fi
    
    PUBHEX="$1"
    VERSION_HEX="6f"   # testnet/signet
    
    python3 - <<PY
    import sys, hashlib
    
    PUBHEX = "${PUBHEX}"
    VERSION = bytes.fromhex("${VERSION_HEX}")
    
    # Base58Check (encode) - no external dependencies
    ALPHABET = b'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    def b58encode(b: bytes) -> str:
        n = int.from_bytes(b, 'big')
        out = bytearray()
        while n > 0:
            n, r = divmod(n, 58)
            out.append(ALPHABET[r])
        # preserve leading zeros
        z = 0
        for byte in b:
            if byte == 0: z += 1
            else: break
        return (ALPHABET[:1]*z + out[::-1]).decode()
    
    # RIPEMD-160 with fallback to pycryptodome
    try:
        _ = hashlib.new('ripemd160')
        def ripemd160(data: bytes) -> bytes:
            h = hashlib.new('ripemd160'); h.update(data); return h.digest()
    except ValueError:
        try:
            from Crypto.Hash import RIPEMD160
            def ripemd160(data: bytes) -> bytes:
                h = RIPEMD160.new(); h.update(data); return h.digest()
        except Exception:
            sys.exit('[fail] RIPEMD160 unavailable. Install: pip install --user pycryptodome')
    
    # Inputs
    try:
        pub = bytes.fromhex(PUBHEX)
    except ValueError:
        sys.exit('[fail] invalid pubkey: continuous hex, no spaces')
    
    # Calculations
    sha = hashlib.sha256(pub).digest()
    h160 = ripemd160(sha)
    spk = bytes.fromhex('76a914') + h160 + bytes.fromhex('88ac')
    payload = VERSION + h160
    chk = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]
    addr = b58encode(payload + chk)
    
    # Output
    print(f"PubKey : {PUBHEX}")
    print(f"hash160 : {h160.hex()}")
    print(f"scriptPubKey : {spk.hex()}")
    print(f"Address : {addr}")
    PY
    ```
    
    Explaining the code:
    
    ```bash
    1. Input → receives the public key in hex (compressed).
    2. Conversion → converts pubkey into bytes and prepares network version (testnet/signet).
    3. Hashing → applies SHA-256 followed by RIPEMD-160 → obtains hash160.
    4. Script → builds the standard P2PKH scriptPubKey.
    5. Address → appends version + checksum → encodes in Base58Check.
    6. Output → prints pubkey, hash160, scriptPubKey, and final address.
    ```
    
    And its execution:
    
    ```bash
    ./reconstruir_endereco_p2pkh.sh 03bfd3218ca0a09183062a8f0ef0b238f726e88fc78b19846e150d065f104a3e03
    PubKey : 03bfd3218ca0a09183062a8f0ef0b238f726e88fc78b19846e150d065f104a3e03
    hash160 : cb71d4930cd0527b3d01d59761c44f3cabe56ce2
    scriptPubKey : 76a914cb71d4930cd0527b3d01d59761c44f3cabe56ce288ac
    Address : mz4fq4uwAaHQjGszvtV65DxuMLk8bWXafD
    ```
    
    Notice that the address (mz4fq4uwAaHQjGszvtV65DxuMLk8bWXafD) is identical to the one generated by Bitcoin Core at the beginning.
    
    Keep in mind that Bitcoin Core currently uses **Descriptor Wallets**, which are more complex and secure, and which we will cover in future articles. It is also important to note that the examples and scripts covered so far dealt with Legacy addresses. Over time, Bitcoin address types continued to evolve.
    

## Evolution of Address Formats in Bitcoin

The evolution of addresses in Bitcoin accompanied the continuous quest for **greater security, efficiency, privacy, and scalability**.

We can summarize this trajectory as follows:

1. **P2PK (Pay to Public Key)** — Direct payments to the public key.
2. **P2PKH (Pay to Public Key Hash)** — Payments to the hash of the public key, concealing it until spent.
3. **P2SH (Pay to Script Hash)** — Payments to the hash of an arbitrary script, enabling more complex spending conditions.
4. **SegWit (P2WPKH and P2WSH)** — Separates signatures from main transaction data, reducing fees and increasing block capacity.
5. **Taproot (P2TR)** — Combines the efficiency of Schnorr signatures with the ability to conceal complex scripts behind a single key.

## Why Do Different Address Types Exist?

In the beginning, P2PKH addresses dominated Bitcoin: simple, easy to use, and universally supported across services. But as the network grew, its limitations became clear: expensive transactions, full blocks, and limited script flexibility. New standards emerged: P2SH for script flexibility and compatibility, SegWit (P2WPKH and P2WSH) to lower fees and resolve transaction malleability, and most recently Taproot, which combines Schnorr signatures with Merkle trees. Each evolution represented a step forward in solving bottlenecks without breaking backwards compatibility.

For `bitcoin-cli`, this means that the same `getnewaddress` command can generate addresses across different generations (legacy, p2sh-segwit, bech32, bech32m). Each type reflects practical objectives: compatibility with older wallets, block space efficiency, improved scalability, and stronger privacy. Ultimately, understanding these formats is not just theoretical—it is about choosing the right address type to save on fees, gain scripting flexibility, and ensure your transactions are accepted everywhere across the network.

As seen in the previous article, we can create different address types using bitcoin-cli:

```bash
bitcoin-cli -signet -rpcwallet=CarteiraDemo getnewaddress "" legacy
bitcoin-cli -signet -rpcwallet=CarteiraDemo getnewaddress "" p2sh-segwit
bitcoin-cli -signet -rpcwallet=CarteiraDemo getnewaddress "" bech32
bitcoin-cli -signet -rpcwallet=CarteiraDemo getnewaddress "" bech32m
```

---

## What's Next...

**Legacy** addresses were the foundation for the entire Bitcoin ecosystem, but the network has evolved significantly since then. Modern formats like **SegWit** and **Taproot** introduce critical improvements in **efficiency, privacy, and scalability**. Understanding this history helps clarify why multiple address types coexist today and how each solves the limitations of its predecessor.

In the next article, we will move beyond theory and dive deeper into **modern address formats** and **Descriptor Wallets**, which represent Bitcoin Core's current standard for managing keys and scripts. This will allow us to explore practically how to generate SegWit and Taproot addresses, while understanding the role of descriptors in wallet organization and security.

