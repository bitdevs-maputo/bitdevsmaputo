---
layout: post
published: true
date: 2026-10-15
title: "A Magia da Multiplicação de Chaves: Entendendo a BIP32"
description: "Aprenda como a BIP32 utiliza curvas elípticas para derivar chaves Bitcoin, criar carteiras HD e relacionar chaves públicas e privadas."
image: /assets/img/og-preview.png
lang: "pt"
category: "blog"
permalink: /pt/blog/bip32-multiplicacao-chaves
---

## A Magia da Multiplicação de Chaves: Entendendo a BIP32 no Bitcoin

### Introdução

Muitos utilizadores de Bitcoin estão familiarizados com a sequência de 12 ou 24 palavras utilizada para recuperar uma carteira digital através da **BIP39**. Contudo, para compreender como essas palavras permitem recuperar as chaves e os endereços de uma carteira, é importante conhecer a **BIP32** (*Bitcoin Improvement Proposal 32*).

Inspirado na aula técnica de Tiago Salem, intitulada *"A Magia da Multiplicação de Chaves — BIP32"*, este artigo explora como a matemática das curvas elípticas permite criar **carteiras determinísticas hierárquicas** (*Hierarchical Deterministic Wallets* ou HD Wallets), eliminando a necessidade de gerir milhares de chaves privadas independentes.

### O que é uma BIP (*Bitcoin Improvement Proposal*)?

Uma **Bitcoin Improvement Proposal (BIP)** é um documento que descreve uma proposta de padrão, processo ou melhoria relacionada com o Bitcoin.

O desenvolvimento do Bitcoin privilegia uma análise cuidadosa e a discussão comunitária. As BIPs permitem documentar ideias técnicas, discutir as suas implicações e coordenar as respetivas implementações.

Proposta em 2012, a BIP32 estabeleceu um padrão para derivar uma hierarquia de chaves criptográficas a partir de uma única semente mestre, tornando a gestão e a recuperação de carteiras muito mais práticas.

### A evolução da gestão de chaves no Bitcoin

#### 1. A base criptográfica

O Bitcoin utiliza criptografia de curvas elípticas baseada na curva `secp256k1` para gerar chaves públicas e privadas.

- **Chave privada:** Um número secreto representado por 32 bytes. Permite assinar transações que movimentam os fundos associados.
- **Chave pública:** Um ponto na curva elíptica, representado pelas coordenadas \((x, y)\).
- **Endereço Bitcoin:** Um identificador codificado, derivado através de um processo específico que utiliza dados da chave pública, dependendo do tipo de endereço.

A chave pública é calculada a partir da chave privada através da multiplicação de pontos na curva elíptica:

\[
P = kG
\]

Em que:

- \(k\) é a chave privada.
- \(G\) é o ponto gerador da curva.
- \(P\) é a chave pública correspondente.

Calcular \(P\) a partir de \(k\) é computacionalmente viável. Recuperar \(k\) a partir de \(P\), por outro lado, é considerado computacionalmente inviável com os métodos clássicos atuais, quando são utilizados parâmetros seguros. Este problema é conhecido como o problema do logaritmo discreto em curvas elípticas.

#### 2. O problema original: reutilização de endereços e cópias de segurança infinitas

Os utilizadores de Bitcoin são incentivados a evitar a reutilização de endereços para melhorar a privacidade financeira.

Antes da popularização das carteiras determinísticas hierárquicas, os programas de carteira podiam gerar chaves privadas aleatórias e independentes para novos endereços. A gestão dessas chaves apresentava vários desafios:

1. **Complexidade das cópias de segurança:** Era necessário garantir que as novas chaves fossem incluídas nas cópias de segurança. Uma cópia que não contivesse uma chave necessária poderia provocar a perda definitiva do acesso aos fundos.
2. **Limitações operacionais:** Empresas e sistemas de pagamento precisavam de uma forma de gerar novos endereços de recebimento sem expor as chaves privadas aos servidores online.
3. **Dificuldades de recuperação:** A gestão de uma coleção crescente de chaves independentes tornava a recuperação da carteira mais complicada.

A BIP32 resolveu estes problemas ao introduzir um padrão para derivar chaves relacionadas de forma hierárquica.

### A solução BIP32: carteiras determinísticas hierárquicas

A BIP32 introduziu um sistema em que uma chave mestre e um código de cadeia (*chain code*) permitem derivar uma hierarquia de chaves filhas.

Em vez de gerar e guardar uma cópia de segurança independente para cada chave privada, uma carteira pode derivar muitas chaves relacionadas a partir de uma única semente mestre.

Esta estrutura pode ser representada como uma árvore:

- **Chave mestre:** A raiz da hierarquia.
- **Chaves filhas:** Chaves derivadas de uma chave principal.
- **Chaves netas:** Chaves derivadas das chaves filhas.
- **Ramos:** Caminhos separados para diferentes contas, endereços ou finalidades.

O processo de derivação é determinístico: utilizando a mesma semente mestre e o mesmo caminho de derivação, uma carteira consegue reproduzir as mesmas chaves.

### A matemática por trás da derivação de chaves públicas

A propriedade matemática central resulta das operações de grupo das curvas elípticas.

Uma chave pública é calculada através da expressão:

\[
P = kG
\]

Suponhamos que uma nova chave privada é calculada adicionando um escalar \(t\) à chave privada original:

\[
k' = (k+t)\bmod n
\]

A chave pública correspondente é:

\[
P' = k'G
\]

Substituindo a expressão da chave privada:

\[
P' = (k+t)G
\]

Aplicando as propriedades das operações de grupo das curvas elípticas:

\[
P' = kG+tG
\]

Como \(P=kG\), obtemos:

\[
\boxed{P'=P+tG}
\]

Isto significa que a nova chave pública pode ser calculada utilizando a chave pública original e os dados correspondentes da derivação, sem revelar a chave privada original.

**Uma distinção importante:** a BIP32 não consiste simplesmente em multiplicar uma chave privada por um fator arbitrário. Utiliza uma função criptográfica baseada em HMAC-SHA512, juntamente com operações de curvas elípticas e um código de cadeia.

Para uma chave filha não endurecida (*non-hardened*), a relação matemática simplificada é:

\[
k_i=(\operatorname{parse}_{256}(I_L)+k_{\text{par}})\bmod n
\]

A chave pública correspondente é:

\[
K_i=\operatorname{parse}_{256}(I_L)G+K_{\text{par}}
\]

Neste contexto:

- \(I_L\) é derivado da saída de HMAC-SHA512.
- \(k_{\text{par}}\) é a chave privada da chave principal.
- \(K_{\text{par}}\) é a chave pública da chave principal.
- \(n\) é a ordem do ponto gerador.

O código de cadeia e o índice de derivação determinam os dados utilizados no processo. É isto que torna a derivação BIP32 estruturada e reproduzível, em vez de uma simples multiplicação arbitrária.

### Demonstração prática em Python

Uma demonstração matemática pode ajudar a compreender a relação entre chaves privadas e públicas.

Utilizando uma biblioteca apropriada para `secp256k1`, a experiência pode seguir estes passos:

1. Gerar uma chave privada inicial \(k\).
2. Calcular a respetiva chave pública \(P=kG\).
3. Escolher um escalar válido \(t\).
4. Calcular uma nova chave privada \(k'=(k+t)\bmod n\).
5. Calcular a nova chave pública diretamente a partir de \(k'\).
6. Calcular, de forma independente, \(P'=P+tG\).
7. Comparar as duas chaves públicas obtidas.

As duas chaves públicas devem coincidir, desde que os valores sejam válidos e as operações estejam corretamente implementadas.

Esta experiência demonstra a propriedade matemática que permite a derivação pública não endurecida. Contudo, não constitui, por si só, uma implementação completa da BIP32, porque a derivação real também exige HMAC-SHA512, códigos de cadeia, serialização e índices de derivação.

Para carteiras Bitcoin reais, utiliza implementações estabelecidas em vez de código experimental para gerar ou gerir chaves privadas.

### Chaves estendidas: `xprv` e `xpub`

A BIP32 define chaves estendidas serializadas que combinam material criptográfico com um código de cadeia e metadados necessários à derivação.

#### `xprv` — Chave privada estendida

Uma chave privada estendida contém uma chave privada e o respetivo código de cadeia, juntamente com metadados de derivação.

Permite derivar chaves privadas e públicas descendentes, respeitando as regras de derivação.

Quem obtiver uma chave privada estendida pode, em geral, derivar as chaves privadas da subárvore correspondente e movimentar os fundos associados.

#### `xpub` — Chave pública estendida

Uma chave pública estendida contém uma chave pública e o respetivo código de cadeia, além dos metadados de derivação.

Permite derivar chaves públicas descendentes não endurecidas sem acesso às chaves privadas. Esta funcionalidade é útil para carteiras de consulta (*watch-only*), sistemas de pagamento e servidores online que precisam de gerar endereços de recebimento sem poder assinar transações.

No entanto, uma `xpub` não deve ser considerada informação pública inofensiva.

**Aviso de privacidade e segurança:**

- Partilhar uma `xpub` pode expor uma parte significativa da estrutura de endereços e da atividade financeira de uma carteira.
- Uma `xpub`, por si só, normalmente não permite movimentar fundos.
- Combinar uma chave pública estendida principal com a chave privada de uma filha não endurecida correspondente pode permitir recuperar a chave privada principal, nas condições de derivação aplicáveis da BIP32.

Por estes motivos, as chaves públicas estendidas devem ser partilhadas apenas quando necessário e com plena compreensão das implicações para a privacidade.

### BIP32 e BIP39: qual é a diferença?

A BIP32 e a BIP39 resolvem problemas relacionados, mas diferentes.

A **BIP32** define a derivação hierárquica determinística de chaves: como uma chave mestre pode produzir uma árvore estruturada de chaves filhas.

A **BIP39** define um sistema mnemónico que converte entropia gerada por computador numa sequência de palavras e utiliza essa sequência, juntamente com uma eventual frase-passe, para derivar uma semente.

A relação entre ambas pode ser resumida da seguinte forma:

1. A entropia é gerada de forma segura.
2. A BIP39 converte essa entropia numa frase mnemónica.
3. A frase mnemónica e a eventual frase-passe são processadas para produzir uma semente.
4. A BIP32 utiliza a semente para gerar a chave mestre e o código de cadeia.
5. As chaves filhas são derivadas de acordo com os caminhos especificados.

Uma frase de recuperação não é simplesmente uma versão legível de uma `xprv`. É uma entrada utilizada para reconstruir a semente a partir da qual a hierarquia de chaves da carteira pode ser derivada.

### Conclusão

A BIP32 é um padrão fundamental para as carteiras determinísticas modernas de Bitcoin. Ao combinar derivação criptográfica com as propriedades matemáticas das curvas elípticas, torna a gestão de chaves mais escalável e permite separar a geração de endereços públicos da assinatura privada de transações.

Compreender a relação entre chaves privadas, chaves públicas, códigos de cadeia, `xprv` e `xpub` é essencial para quem estuda desenvolvimento Bitcoin, arquitetura de carteiras ou segurança criptográfica.

A principal lição é que **a BIP32 não é apenas um truque de multiplicação de chaves**. É um sistema de derivação cuidadosamente especificado que permite recuperar carteiras determinísticas e derivar chaves públicas não endurecidas, preservando o segredo das chaves privadas sob as condições de segurança previstas.