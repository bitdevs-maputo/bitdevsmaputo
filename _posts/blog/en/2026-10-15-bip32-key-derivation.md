---
layout: post
published: true
date: 2026-10-15
title: "The Magic of Key Multiplication: Understanding BIP32 in Bitcoin"
description: "Explore BIP32, hierarchical deterministic wallets, elliptic curve mathematics, and the relationship between extended public and private keys."
image: /assets/img/og-preview.png
lang: "en"
category: "blog"
permalink: /en/blog/bip32-key-derivation
---

## The Magic of Key Multiplication: Understanding BIP32 in Bitcoin

### Introduction

Many Bitcoin users are familiar with the sequence of 12 or 24 English words used to back up digital wallets through **BIP39**. However, to understand how these words can restore a wallet's keys and addresses, it is important to take a step back and understand **BIP32** (*Bitcoin Improvement Proposal 32*).

Inspired by the technical lesson by Tiago Salem, titled *"A Magia da Multiplicação de Chaves — BIP32"*, this article explores how elliptic curve mathematics enables the creation of **Hierarchical Deterministic (HD) wallets**, eliminating the need to manage thousands of independent private keys.

### What Is a Bitcoin Improvement Proposal (BIP)?

A **Bitcoin Improvement Proposal (BIP)** is a document that describes a proposed standard, process, or improvement related to Bitcoin.

Bitcoin development emphasizes careful review and community discussion. BIPs provide a structured way to document technical ideas, discuss their implications, and coordinate implementations.

Introduced in 2012, BIP32 established a standard for deriving a hierarchy of cryptographic keys from a single master seed, making wallet management and backup significantly more practical.

### The Evolution of Bitcoin Key Management

#### 1. The Cryptographic Foundation

Bitcoin uses elliptic curve cryptography based on the `secp256k1` curve to generate public and private keys.

- **Private key:** A secret integer represented using 32 bytes. It authorizes the signing of transactions that spend the associated funds.
- **Public key:** A point on the elliptic curve represented by coordinates \((x, y)\).
- **Bitcoin address:** An encoded identifier derived through a specific process involving public key data, depending on the address type.

The public key is calculated from the private key using elliptic curve multiplication:

\[
P = kG
\]

Where:

- \(k\) is the private key.
- \(G\) is the generator point of the curve.
- \(P\) is the corresponding public key.

Calculating \(P\) from \(k\) is computationally practical. Recovering \(k\) from \(P\), however, is considered computationally infeasible with current classical computing methods when secure parameters are used. This is the elliptic curve discrete logarithm problem.

#### 2. The Original Problem: Address Reuse and Endless Backups

Bitcoin users are encouraged to avoid address reuse to improve financial privacy.

Before hierarchical deterministic wallets became widespread, wallet software could generate independent random private keys for new addresses. Managing these keys created several challenges:

1. **Backup complexity:** Users needed to ensure that newly generated keys were included in their backups. A backup that did not contain a required key could result in permanent loss of access to funds.
2. **Operational limitations:** Businesses and payment systems needed a way to generate new receiving addresses without exposing private keys to online servers.
3. **Recovery difficulties:** Managing a growing collection of unrelated keys made wallet restoration more complicated.

BIP32 addressed these problems by introducing a standardized hierarchy of related keys.

### The BIP32 Solution: Hierarchical Deterministic Wallets

BIP32 introduced a system in which a master key and a chain code can be used to derive a hierarchy of child keys.

Instead of independently generating and backing up every private key, a wallet can derive many related keys from a single master seed.

This structure can be represented as a tree:

- **Master key:** The root of the hierarchy.
- **Child keys:** Keys derived from a parent key.
- **Grandchild keys:** Keys derived from child keys.
- **Branches:** Separate paths used for different accounts, addresses, or purposes.

The derivation process is deterministic: given the same master seed and derivation path, a wallet can reproduce the same keys.

### The Mathematics Behind Public Key Derivation

The key mathematical property comes from elliptic curve group operations.

A public key is calculated as:

\[
P = kG
\]

Suppose a new private key is calculated by adding a scalar \(t\) to the original private key:

\[
k' = k + t \pmod n
\]

The corresponding public key is:

\[
P' = k'G
\]

Substituting the private key expression gives:

\[
P' = (k+t)G
\]

Using the properties of elliptic curve group operations:

\[
P' = kG+tG
\]

Since \(P=kG\), we obtain:

\[
\boxed{P'=P+tG}
\]

This means the new public key can be calculated using the original public key and the corresponding public derivation data, without revealing the original private key.

**An important distinction:** BIP32 does not simply multiply a private key by an arbitrary factor. It uses a cryptographic derivation function based on HMAC-SHA512, together with elliptic curve operations and a chain code.

For a non-hardened child key, the simplified mathematical relationship is:

\[
k_i = (\operatorname{parse}_{256}(I_L)+k_{\text{par}})\bmod n
\]

And the corresponding public key is:

\[
K_i = \operatorname{parse}_{256}(I_L)G+K_{\text{par}}
\]

Here, \(I_L\) is derived from the HMAC-SHA512 output, \(k_{\text{par}}\) is the parent private key, \(K_{\text{par}}\) is the parent public key, and \(n\) is the order of the generator point.

The chain code and derivation index determine the derivation data. This is what makes BIP32 derivation structured and reproducible rather than a simple arbitrary multiplication.

### A Practical Demonstration in Python

A mathematical demonstration can help illustrate the relationship between private and public keys.

Using a suitable `secp256k1` library, the experiment can follow these steps:

1. Generate an initial private key \(k\).
2. Calculate its public key \(P=kG\).
3. Choose a valid scalar \(t\).
4. Calculate a new private key \(k'=(k+t)\bmod n\).
5. Calculate the new public key directly from \(k'\).
6. Independently calculate \(P'=P+tG\).
7. Compare both resulting public keys.

The two public keys should match, provided the scalar values are valid and the operations are implemented correctly.

This experiment illustrates the mathematical property behind non-hardened public key derivation. It is not, by itself, a complete BIP32 implementation, because actual BIP32 derivation also requires HMAC-SHA512, chain codes, serialization, and derivation indexes.

For real Bitcoin wallets, use established implementations rather than experimental code to generate or manage private keys.

### Extended Keys: `xprv` and `xpub`

BIP32 defines serialized extended keys that combine key material with a chain code and metadata required for derivation.

#### `xprv` — Extended Private Key

An extended private key contains a private key and its associated chain code, together with derivation metadata.

It can derive private and public descendants, subject to the derivation rules.

Anyone who obtains an extended private key can generally derive the private keys within its corresponding subtree and spend the associated funds.

#### `xpub` — Extended Public Key

An extended public key contains a public key and its chain code, along with derivation metadata.

It allows the derivation of non-hardened public descendants without access to private keys. This makes it useful for watch-only wallets, payment systems, and online servers that need to generate receiving addresses without being able to sign transactions.

However, an `xpub` is not harmless public information.

**Privacy and security warning:**

- Sharing an `xpub` can expose a substantial portion of a wallet's address structure and transaction activity.
- An `xpub` alone does not normally allow an attacker to spend funds.
- Combining a parent extended public key with a corresponding non-hardened child private key can reveal the parent private key under the applicable BIP32 derivation conditions.

For these reasons, extended public keys should be shared only when necessary and with a clear understanding of the privacy implications.

### BIP32 and BIP39: Understanding the Difference

BIP32 and BIP39 solve related but different problems.

**BIP32** defines hierarchical deterministic key derivation: how a master key can produce a structured tree of child keys.

**BIP39** defines a mnemonic system that converts computer-generated entropy into a sequence of words and uses that mnemonic, together with an optional passphrase, to derive a seed.

The relationship can be summarized as follows:

1. Entropy is generated securely.
2. BIP39 converts the entropy into a mnemonic phrase.
3. The mnemonic and optional passphrase are processed to produce a seed.
4. BIP32 uses the seed to generate the master key and chain code.
5. Child keys are derived according to specified paths.

A recovery phrase is therefore not simply a readable version of an `xprv`. It is an input used to reconstruct the seed from which the wallet's key hierarchy can be derived.

### Conclusion

BIP32 is a foundational standard for modern deterministic Bitcoin wallets. By combining cryptographic derivation with the mathematical properties of elliptic curves, it makes key management more scalable and enables useful separation between public address generation and private transaction signing.

Understanding the relationship between private keys, public keys, chain codes, `xprv`, and `xpub` is essential for anyone studying Bitcoin development, wallet architecture, or cryptographic security.

The most important lesson is that **BIP32 is not merely a trick involving key multiplication**. It is a carefully specified derivation system that makes deterministic wallet recovery and non-hardened public key derivation possible while preserving the secrecy of private keys under the intended security assumptions.