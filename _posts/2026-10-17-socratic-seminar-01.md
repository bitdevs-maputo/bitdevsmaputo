---
layout: post
published: true
date: 2026-10-17
type: socratic
title: "Socratic Seminar 01: Who Really Runs Bitcoin?"
meetup: "https://luma.com/znp0x852"
permalink: /en/2026-10-17-socratic-seminar-01
lang: "en"
---

## Location

The event will be hosted at **Hotel Onomo**, Maputo | [Map](https://maps.app.goo.gl/usnCTwnL3faNRdG29)

**Date:** October 17, 2026 | **Time:** 09:00 to 12:00

## Announcements

Join us for the first BitDevs Maputo [Socratic Seminar](/about)!
We will run Bitcoin Core on our own laptops and find out who really
runs Bitcoin. A special thank you to our sponsor [Btrust](https://www.btrust.tech/).

**Bring your laptop.**

## Reminders

- We prefer no photos and no videos during the event
- [Chatham House Rule](https://www.chathamhouse.org/about-us/chatham-house-rule)
- Leave the meeting space as clean as you found it
- Suggest topics for the next Socratic Seminar! [Where to find topics?](/about/find-topics)

# Topics

### Opening

---

MC: Angela

- Welcome and introduction to the Socratic format
- Introduction to BitDevs Maputo and the goals of the seminar

### Introduction

---

MC: Daniel

- Introduction to Bitcoin Famba

### Bitcoin Core

---

MC: Custódio

- [Download and run a Bitcoin Core node](https://bitcoincore.org/en/download/)
- [JSON-RPC interface: the commands we will use](https://github.com/bitcoin/bitcoin/blob/master/doc/JSON-RPC-interface.md)
- [BIPs implemented by Bitcoin Core](https://github.com/bitcoin/bitcoin/blob/master/doc/bips.md)
- Who decides the rules of Bitcoin? Developers, miners, exchanges, or the people who run a node?

### Private & Public Keys

---

MC: Custódio

- Not your keys, not your coins
- [Descriptors: how Core describes keys, scripts and addresses](https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md)
- [BIP32: HD wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [Code: key generation (key.cpp)](https://github.com/bitcoin/bitcoin/blob/master/src/key.cpp)


### Addresses & Transactions

---

MC: Custódio

- [Code: transaction structure (transaction.h)](https://github.com/bitcoin/bitcoin/blob/master/src/primitives/transaction.h)
- [Code: validation and mempool (validation.cpp)](https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp)
- [Code: network propagation (net_processing.cpp)](https://github.com/bitcoin/bitcoin/blob/master/src/net_processing.cpp)
- [PSBT: building and signing a transaction in parts](https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md)

#### Closing & Upcoming Events

---

MC: Angela

- Summary of the discussion
- Next Socratic Seminar and community group