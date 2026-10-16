---
layout: post
published: true
date: 2026-10-02
title: "Mainnet, Testnet, Signet e Regtest: O Universo das Redes Bitcoin"
description: "Um guia prático sobre as redes do Bitcoin: entenda as diferenças, objetivos e características da Mainnet, Testnet, Signet e Regtest."
image: /assets/img/og-preview.png
lang: "pt"
category: "blog"
permalink: /pt/blog/redes-bitcoin
---
## Mainnet, Testnet, Signet e Regtest: O Universo das Redes Bitcoin

por Rafael Santos

Atualizado em: 22/07/2025 ∙ 30 min leitura

Assim que começamos a “brincar” com o desenvolvimento do Bitcoin, nos deparamos com essa informação: temos várias redes Bitcoin. Sendo mais puro, só existe uma rede Bitcoin né? Mas com a rede Bitcoin não se “brinca”. Sendo assim, para começar a desenvolver com o Bitcoin temos essas redes auxiliares de teste e desenvolvimento. Esse artigo pretende mostrar as diferenças, objetivos e funcionalidades de cada rede.

Primeiro, é importante entender o porquê delas existirem. Lidar com a rede principal do Bitcoin exige muita responsabilidade, segurança, garantias e cuidados. Então, para promover adoção, segurança e manutenção adequada, é importante que os testes, aprimoramentos e inovações sejam feitos em uma rede que não comprometa o uso da rede principal. Se esses testes fossem feitos na rede principal, qualquer erro ou problema poderia impactar todo ecossistema trilionário, acarretando em perdas financeiras e na confiabilidade da rede.

Além da rede principal (mainnet), temos outras 3: testnet, signet e regtest. Podemos listar os principais objetivos dessa redes alternativas:

**Testes de novos recursos e funcionalidades**

Permitem experimentar atualizações, melhorias e correções sem colocar dinheiro real em risco.

**Aprendizado e treinamento**

Usuários e desenvolvedores podem praticar, criar sistemas e carteiras, realizar transações e aprender sobre desenvolvimento no ecossistema sem medo de perdas financeiras. É o nosso caso aqui nesses artigos

**Simulação de cenários diversos**

Facilitam a criação de ambientes para simular ataques, forks ou situações extremas sem afetar a mainnet.

**Desenvolvimento e integração de aplicações**

Garantem que serviços, aplicativos e integrações possam ser testados de forma segura antes do lançamento oficial.

**Automação de testes e desenvolvimento local**

Redes como a regtest permitem rodar redes privadas para testes automatizados e depuração detalhada, sem depender de uma infraestrutura complexa de vários nós interconectados pelo planeta.

# Visão Geral das Redes Bitcoin

O Bitcoin têm 4 redes oficiais que podem ser configuradas no Bitcoin Core. Cada uma tem um propósito e uma finalidade própria.

- **Mainnet:**
    
    Rede principal do Bitcoin. Transações reais, moedas com valor financeiro e segurança máxima. Tudo o que acontece nela é definitivo e irreversível.
    
- **Testnet:**
    
    Rede pública de testes. Ideal para aprendizado, desenvolvimento e simulações. As moedas não têm valor real e podem ser obtidas gratuitamente em faucets (explicarei mais a seguir).
    
- **Signet:**
    
    Rede de testes moderna, com mineração controlada por administradores. Oferece ambiente estável e previsível para testar atualizações e soft forks. É a rede mais próxima da mainnet, sendo utilizada, por exemplo, para testar mudanças a serem feitas no protocolo.
    
- **Regtest:**
    
    Rede privada/local, criada pelo próprio programador. Permite controle total sobre a geração de blocos, ideal para experimentos e testes rápidos.
    
    Abaixo temos uma tabela comparativa entre as 4 redes.
    

| Rede | Uso Principal | Valor das Moedas | Faucet Disponível | Porta Padrão | Risco | Controle de Blocos |
| --- | --- | --- | --- | --- | --- | --- |
| **Mainnet** | Transações reais | Real | Não | 8333 | Muito alto | Descentralizado |
| **Testnet** | Testes públicos | Nenhum | Sim | 18333 | Nenhum | Descentralizado |
| **Signet** | Testes de protocolo | Nenhum | Sim | 38333 | Nenhum | Centralizado (admin) |
| **Regtest** | Testes locais/privados | Nenhum | Não | 18444 | Nenhum | Usuário (totalmente) |

A seguir veremos como rodar cada uma das 4 redes, testando scripts básicos de exemplo. Mas antes vamos entender como escolhemos e definimos qual das redes será utilizada pelo Bitcoin Core. Existem duas maneiras de escolher a rede, ou por um parâmetro na chamada do bitcoind/bitcoin-cli ou através do arquivo de configuração. Primeiro vamos ver utilizando o parâmetro.

```bash
#Para rodar na mainnet (é só não usar o parâmetro):
bitcoind -daemon
bitcoin-cli ...
```

```bash
#Para rodar na testnet:
bitcoind -testnet -daemon
bitcoin-cli -testnet ...
```

```bash
#Para rodar na signet:
bitcoind -signet -daemon
bitcoin-cli -signet ...
```

```bash
#Para rodar na regtest:
bitcoind -regtest -daemon
bitcoin-cli -regtest ...
```

Outra maneira de definir a rede é através do arquivo de configuração **bitcoin.conf**. Basta adicionar uma linha no arquivo setando 1 para a variável que representa a rede em questão:

```bash
testnet=1
```

```bash
signet=1
```

```bash
regtest=1
```

Não deve-se utilizar mais de uma dessas linhas ao mesmo tempo, pois o Bitcoin Core só suporta uma rede ativa por instância. Caso nenhuma dessas linha tenha sido colocada no **bitcoin.conf**, nem seja utilizado o parâmetro de configuração, então a rede que estará rodando é a **mainnet**.

Vamos então ver cada uma das redes.

---

## Mainnet

A rede principal do Bitcoin

A **Mainnet** é a rede principal do Bitcoin, onde as transações possuem valor real e irreversível. É nela que o protocolo opera de fato, com regras de consenso rigorosas, ampla descentralização e segurança garantida por milhares de nós e mineradores ao redor do mundo. Qualquer operação executada na mainnet envolve bitcoins verdadeiros e, por isso, exige cautela. É o ambiente definitivo para uso em produção.

Para rodar o bitcoind na **mainnet** podemos criar uma pasta e um arquivo bitcoin.conf dentro dela conforme a seguir:

```bash
#bitcoin.conf para mainnet
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
prune=2000
```

Nesse arquivo de configuração temos os dados para comunicação RPC e o **prune** (não precisamos entender o **fallbackfee** agora). A variável **prune** permite que seja indicada um tamanho máximo (em MegaBytes) para armazenar a blockchain. Atualmente, em julho de 2025, a blockchain do Bitcoin possui cerca de 906.000 blocos, com tamanho estimado de mais ou menos 675 GigaBytes. Isso implica na necessidade de um enorme espaço. Por isso, podemos “podar” a estrutura, armazenando apenas uma parte dela. O **prune=2000** indica que só armazenaremos os 2GB mais recentes da blockchain. Isso **não** quer dizer que, ao iniciar o bitcoind, o programa não tenha que verificar todos blocos, desde o início. 

Podemos inicar então o bitcoind na mainnet:

```bash
bitcoind -datadir="." -daemon
```

Onde o **-datadir="."** indica a pasta onde está o bitcoin.conf e onde serão armazenados os dados. Ao começar a rodar, o bitcoind cria o Nó e inicia uma etapa de sincronização desde o bloco gênesis. Essa etapa pode ser bem demorada (levando alguns dias até). Podemos rodar um script para verificar o andamento da sincronização:

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

  echo "Atualizado em: $(date)"
  echo "Blocos verificados: $BLOCKS / $HEADERS (${PERCENT_BLOCOS}%)"
  echo "Verificação real (peso computacional): ${PERCENT_VERIF}%"

  sleep 30
done
```

Nesse script, a cada 30 segundos, serão mostradas as atualizações, como data e horário, quantidade de blocos verificados e um percentual de verificação real. Os dados são obtidos por meio da chamada ao bitcoin-cli com o comando **getblockchaininfo**. O retorno do comando **bitcoin-cli getblockchaininfo** é estruturado em formato JSON. Para extrair os campos específicos desse retorno, utilizamos o utilitário jq, uma ferramenta de linha de comando voltada para o **processamento de dados JSON**. Por fim, o script calcula as porcentagens e escreve na tela. Essa verificação real, mostrada no final, difere do percentual de blocos uma vez que os blocos mais recentes são bem mais demorados que os antigos. Abaixo como fica a saída do script:  

```bash
#mainnet
Atualizado em: seg 21 jul 2025 18:02:02 -03
Blocos verificados: 366570 / 906578 (40.43%)
Verificação real (peso computacional): 6.3458810675100800%
```

Perceba que nesse exemplo, 40% dos blocos já tinham sido verificados, no entanto apenas 6,34% do total de verificação estimada foi concluído. 

Cabe salientar que além do espaço para guardar a blockchain, que pode ser podado, temos que ter espaço suficiente para armazenar as UTXO também. Nessa data, o tamanho estimado das UTXO é de 11 GigaBytes.

Com relação aos diferentes tipos de endereços do Bitcoin, podemos verificar usando o comando **getnewaddress** com os parâmetros adequados. O script abaixo gera os 4 tipos de endereços da rede Bitcoin:

```bash
# gerar_enderecos.sh – Cria ou carrega wallet e gera endereços de diferentes tipos

DATADIR="."          # Altere para o caminho correto se necessário
WALLET="walletdemo"

echo "Verificando wallet '$WALLET'..."

WALLETS_LOADED=$(bitcoin-cli -datadir="$DATADIR" listwallets | jq -r '.[]')

if [[ ! " $WALLETS_LOADED " =~ " $WALLET " ]]; then
  echo "Wallet não carregada. Verificando existência no disco..."
  if [ -d "$DATADIR/wallets/$WALLET" ]; then
    echo "Wallet existe. Carregando..."
    bitcoin-cli -datadir="$DATADIR" loadwallet "$WALLET"
  else
    echo "Criando nova wallet chamada '$WALLET'..."
    bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET"
  fi
else
  echo "Wallet '$WALLET' já carregada."
fi

echo
echo "Gerando endereços..."

LEGACY=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "legacy" legacy)
P2SH=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "p2sh" p2sh-segwit)
BECH32=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "bech32" bech32)
TAPROOT=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "taproot" bech32m)

echo "Endereço P2PKH (Legacy): $LEGACY"
echo "Endereço P2SH-SegWit: $P2SH"
echo "Endereço Bech32 (P2WPKH): $BECH32"
echo "Endereço Taproot (Bech32m): $TAPROOT"

echo
echo "Script concluído com sucesso."
```

Como resultado da execução do script temos:

```bash
Gerando endereços...
Endereço P2PKH (Legacy): 1BPQUbbYAEbKLRQWEzgFxpewbWA7guGjTz
Endereço P2SH-SegWit: 3JoSXxDegiVLXWNbk3S2ysKH3rUtK88fuv
Endereço Bech32 (P2WPKH): bc1qpkfvw8meyx8gkk8ntrk0g2sumas3k8w36g53k8
Endereço Taproot (Bech32m): bc1pu8zndzsjcmssg43wf3dusjjhe930x3ckuslganz9xmsz65h26njqcznxhd

Script concluído com sucesso.
```

Para finalizar o entendimento básico da **mainnet**, podemos rodar um simples script de teste, mesmo enquanto a sincronização ainda acontece:

```bash
echo "Blocos mais recentes disponíveis"
echo "Atualizado em: $(date -R)"
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
    
    echo "Bloco #$i"
    echo "Hash: $hash"
    echo "Data/hora: $data_formatada"
    echo "Nº de transações: $nTx"
    echo "----------------------------------------"
  else
    echo "Bloco #$i ainda não disponível (em sincronização ou podado)"
    echo "----------------------------------------"
  fi
done

```

Com esse script podemos ver informações sobre os 5 últimos blocos sincronizado. O script usa comandos como **getblockcount**, **getblockhash** e **getblockheader**, além do **jq** para manipular o **JSON** de resposta. Podemos ver o número e o hash do bloco, a data/hora de criação e o número total de transações incluídas naquele bloco, como vemos abaixo:

```bash
Bloco #493907
Hash: 0000000000000000003fca57ad038476db43da96587aea3e8e17c38496456086
Data/hora: 2017-11-10 10:21:04
Nº de transações: 1823
```

---

## Testnet

Rede de testes tradicional do Bitcoin

A **Testnet** é uma das principais redes de teste do Bitcoin, criada para permitir que desenvolvedores e entusiastas experimentem funcionalidades da rede sem risco financeiro. Nessa rede, os bitcoins não possuem valor real e podem ser obtidos gratuitamente por **faucets**, o que a torna ideal para testar transações, scripts e aplicações em um ambiente descentralizado. Diferentemente da **Signet**, que possui uma mineração coordenada e mais previsível, a Testnet é aberta à mineração pública, o que pode gerar maior instabilidade, como blocos órfãos frequentes ou variações nos tempos de confirmação. Apesar disso, por ser aberta e próxima da mainnet em termos de funcionamento, ela é uma ferramenta valiosa para experimentação e testes.

Para rodar o bitcoind na **testnet** podemos criar uma pasta e um arquivo bitcoin.conf dentro dela conforme a seguir:

```bash
#bitcoin.conf para testnet
testnet=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
prune=2000
```

Perceba que podemos “podar” a blockchain também (**prune=2000)**. Atualmente, em julho de 2025, a blockchain da testnet do Bitcoin possui cerca de **4,5 mihões** de blocos, com tamanho estimado de mais ou menos **170 GigaBytes**. 

Podemos inicar então o bitcoind na testnet:

```bash
bitcoind -datadir="." -daemon
```

Desde que o **datadir** reflita a pasta onde está o bitcoin.conf, não precisamos usar o parâmetro **-testnet**. ****Da mesma forma, assim que inicia o Nó, a sincronização dos blocos começa. Cabe salientar que existe uma pré-sincronização, antes mesmo de começar a validar os blocos, que também pode demorar. Podemos verificar essa pré-sincronização olhando os logs:

```bash
tail -n 5 testnet3/debug.log
2025-07-22T14:08:14Z Pre-synchronizing blockheaders, height: 1222000 (~75.07%)
2025-07-22T14:08:15Z Pre-synchronizing blockheaders, height: 1224000 (~75.10%)
2025-07-22T14:08:16Z Pre-synchronizing blockheaders, height: 1226000 (~75.16%)
2025-07-22T14:08:20Z Pre-synchronizing blockheaders, height: 1228000 (~75.21%)
2025-07-22T14:08:22Z Pre-synchronizing blockheaders, height: 1230000 (~75.25%)
```

Neste caso, 75% da pré-sincronização estava completa. Depois, podemos rodar aquele mesmo script feito na mainnet para verificar o andamento da sincronização:

```bash
#testnet
Atualizado em: ter 22 jul 2025 14:18:18 -03
Blocos verificados: 1164276 / 4578642 (25.42%)
Verificação real (peso computacional): 2.15911228641810500%
```

Nesse momento do exemplo tínhamos cerca de 25% dos blocos verificados, representando 2,15% do total estimado. Após terminar a sincronização, podemos rodar o script de exemplo abaixo para criar uma carteira, associar a ela um endereço, receber **tBTC** através de um **faucet** (sites que dão tBTC), verificar o saldo da carteira e as transações recentes.

```bash
# script_testnet.sh – Gera endereço, pede BTC da faucet e aguarda saldo real

DATADIR="."  # ajuste se necessário
WALLET="testwallet"

echo "Verificando se há wallet carregada..."

WALLETS_LOADED=$(bitcoin-cli -datadir="$DATADIR" listwallets | jq -r '.[]')

if [[ ! " $WALLETS_LOADED " =~ " $WALLET " ]]; then
  echo "Wallet '$WALLET' não está carregada. Verificando se existe..."
  if [ -d "$DATADIR/wallets/$WALLET" ]; then
    echo "Wallet existe no disco. Carregando..."
    bitcoin-cli -datadir="$DATADIR" loadwallet "$WALLET"
  else
    echo "Wallet não existe. Criando nova wallet chamada '$WALLET'..."
    bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET"
  fi
else
  echo "Wallet '$WALLET' já está carregada."
fi

echo
echo "Gerando novo endereço Testnet..."
ADDR=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "" bech32)
echo "Endereço gerado: $ADDR"

echo
echo "Acesse a faucet da Testnet e envie BTC para esse endereço:"
echo "https://coinfaucet.eu/en/btc-testnet/"
echo

read -p "Pressione ENTER para iniciar o monitoramento do saldo..."

echo "Aguardando saldo... (pode demorar alguns minutos enquanto a transação é minerada)"
SECONDS=0

while true; do
  BAL=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getreceivedbyaddress "$ADDR")
  if (( $(echo "$BAL > 0" | bc -l) )); then
    echo "Saldo recebido: $BAL BTC"
    break
  fi
  echo "Ainda sem saldo... tempo decorrido: ${SECONDS}s"
  sleep 30
done

echo
echo "Consultando saldo da carteira..."
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getbalance

echo
echo "Listando transações recentes..."
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" listtransactions "*" 5

```

Podemos gerar os diferentes tipo de endereços na testnet também, rodando aquele mesmo script:

```bash
Gerando endereços...
Endereço P2PKH (Legacy): n4QBcuAakTB75aG4YMkEiRb5rZV5AJUZT4
Endereço P2SH-SegWit: 2NFHUn3gXrHZzb4ivGDCaLU2mjEwZbWhDqJ
Endereço Bech32 (P2WPKH): tb1q49sjj4yp5ymvhl9lje57rqlgg4z72fc5q4lnqm
Endereço Taproot (Bech32m): tb1pwjksv0mmgspyelk97ncq2skhjeph2620n6gsj42z6cps9ww26nvsype89r

Script concluído com sucesso.
```

---

## Signet

Rede de testes do Bitcoin com mineração coordenada

A **Signet** é uma rede de testes do Bitcoin criada para oferecer um ambiente mais estável, previsível e controlado do que a tradicional Testnet. Seu principal diferencial é o uso de **blocos assinados por entidades autorizadas**, o que evita oscilações imprevisíveis na mineração, como as que ocorrem na Testnet pública. Por isso, a Signet é ideal para testes que exigem sincronização confiável, confirmações rápidas e melhor previsibilidade. Embora compartilhe os mesmos tipos de endereços da Testnet (como **tb1q**... e **tb1p**...), a Signet opera de forma mais coordenada, facilitando o desenvolvimento, testes automatizados e demonstrações técnicas sem as incertezas de uma rede aberta.

Para rodar o bitcoind na **signet** podemos criar uma pasta e um arquivo bitcoin.conf dentro dela conforme a seguir:

```bash
signet=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
```

Atualmente, em julho de 2025, a blockchain da signet do Bitcoin possui cerca de **261.000** de blocos, com tamanho estimado de mais ou menos 25 **GigaBytes**. 

Podemos inicar então o bitcoind na signet:

```bash
bitcoind -datadir="." -daemon
```

A sincronização dos blocos começa. Também existe uma pré-sincronização na signet, embora seja mais rápida. Após, podemos verificar a sincronização rodando aquele mesmo script:

```bash
#signet
Atualizado em: ter 22 jul 2025 21:13:42 -03
Blocos verificados: 203332 / 261788 (77.67%)
Verificação real (peso computacional): 17.8348096923163800%
```

Podemos gerar os diferentes tipo de endereços na **signet** também, rodando aquele mesmo script:

```bash
Gerando endereços...
Endereço P2PKH (Legacy): mxTudpK1Hqtu93v9Qcotn2CVDtiZWPwbcY
Endereço P2SH-SegWit: 2NAG6g1DcwcMnmH3WEakKbAYZGj9w66aXUi
Endereço Bech32 (P2WPKH): tb1q36znl86c8ctw5j38rcjt3gev50g5a0pl4yjlwf
Endereço Taproot (Bech32m): tb1pw03u6y8772ysdwa6mr78ms8kuupfgruz0qz97z6z5vnqflzxxxpse6zqax

Script concluído com sucesso.
```

Por fim, podemos rodar um script de exemplo:

```bash
WALLET="signetwallet"
DATADIR="."

echo "Verificando wallet '$WALLET'..."
if ! bitcoin-cli -datadir="$DATADIR" listwallets | grep -q "$WALLET"; then
  if [ -d "$DATADIR/wallets/$WALLET" ]; then
    echo "Wallet existe. Carregando..."
    bitcoin-cli -datadir="$DATADIR" loadwallet "$WALLET" >/dev/null
  else
    echo "Criando nova wallet chamada '$WALLET'..."
    bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET" >/dev/null
  fi
else
  echo "Wallet '$WALLET' já está carregada."
fi

echo
echo "Gerando endereço de destino..."
ADDR=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress)
echo "Endereço gerado: $ADDR"
echo
echo "Use uma faucet da Signet para enviar BTC a esse endereço:"
echo "https://signet.dcorral.com/"
echo "https://signetfaucet.com/"
echo "https://faucet.signet.bc-2.jp/"
echo

SECONDS=0
while true; do
  UTXOS=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" listunspent 1 9999999 "[\"$ADDR\"]")
  COUNT=$(echo "$UTXOS" | jq 'length')
  if [ "$COUNT" -gt 0 ]; then
    echo "UTXO recebido após ${SECONDS}s:"
    echo "$UTXOS" | jq
    break
  fi
  echo "Aguardando UTXO... tempo decorrido: ${SECONDS}s"
  echo "Endereço: $ADDR"
  sleep 15
done
```

O script cria/carrega uma carteira, gera um endereço, espera receber **sBTC** através de um **faucet** e lista os **UTXOs** de transações que pertencem ao **endereço** dentro da **carteira carregada** .

---

## Regtest

A rede de teste local do bitcoin

A rede **Regtest** é um ambiente privado e controlado de testes do Bitcoin, executado inteiramente de forma local. Seu principal propósito é permitir experimentações rápidas, seguras e sem custos, já que os blocos podem ser minerados instantaneamente com um simples comando. Diferente das outras redes, não há conexão com pares externos nem necessidade de esperar confirmações reais, tornando-a ideal para testes automatizados, desenvolvimento de scripts e validação de funcionalidades em tempo real.

Para rodar o bitcoind na **regtest** basta apenas criar uma pasta com o arquivo bitcoin.conf dentro:

```bash
regtest=1
rpcuser=teste
rpcpassword=teste
rpcallowip=127.0.0.1
fallbackfee=0.0001
```

Diferentemente das outras redes, a Regtest não requer uma etapa relevante de sincronização, uma vez que é uma rede local criada do zero, contendo apenas o bloco gênesis até que novos blocos sejam minerados manualmente. 

Podemos inicar então o bitcoind na regtest:

```bash
bitcoind -datadir="." -daemon
```

Ao rodar o script de sincronização, temos os blocos verificados zerados (pois não existe mesmo) e a verificação total finalizada:

```bash
Atualizado em: ter 22 jul 2025 23:01:24 -03
Blocos verificados: 0 / 0 (%)
Verificação real (peso computacional): 100%
```

Podemos gerar os diferentes tipo de endereços na **regtest** também, rodando aquele mesmo script:

```bash
Gerando endereços...
Endereço P2PKH (Legacy): mvdHhLqBJDUK3xiM52Q93DFZGdUQyKrZb7
Endereço P2SH-SegWit: 2NDkztMtZQLeufi7JfUVdFaUEifZSLsTCGw
Endereço Bech32 (P2WPKH): bcrt1q0qzzk72lpuecraxflkeq6x60c2r4jgvtkngmm7
Endereço Taproot (Bech32m): bcrt1pecx9u8segeaey68vwayk8cfspuydqfzp24es5z68jtjkd78gmdwszyll0s

Script concluído com sucesso.
```

Para finalizar podemos criar um script para **regtest**, que cria 2 endereços, minera blocos e transfere BTC:

```bash
# script_regtest.sh – Cria endereço, minera blocos e transfere BTC no Regtest

DATADIR="."  # ou defina o caminho se estiver fora da pasta atual
WALLET="regwallet"
# 1. Cria ou carrega a carteira
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getwalletinfo 2>/dev/null || \
bitcoin-cli -datadir="$DATADIR" createwallet "$WALLET"
# 2. Gera dois endereços
ADDR_FROM=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "remetente" bech32)
ADDR_TO=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getnewaddress "destinatario" bech32)
echo "Endereço remetente: $ADDR_FROM"
echo "Endereço destinatário: $ADDR_TO"
# 3. Minera 101 blocos para obter saldo (50 BTC por bloco)
echo "Minerando blocos para gerar saldo..."
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" generatetoaddress 101 "$ADDR_FROM"
# 4. Transfere BTC
echo "Enviando 1 BTC do remetente para o destinatário..."
TXID=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" sendtoaddress "$ADDR_TO" 1.0)
# 5. Minera 1 bloco para confirmar a transação
bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" generatetoaddress 1 "$ADDR_FROM"
# 6. Mostra saldo final
SALDO=$(bitcoin-cli -datadir="$DATADIR" -rpcwallet="$WALLET" getreceivedbyaddress "$ADDR_TO")
echo "Saldo final do destinatário: ${SALDO} BTC"
```

E temos como saída:

```bash
Endereço remetente: bcrt1qtmecvrrdngju2zdud6q4875fk2rd9cl3sarwaw
Endereço destinatário: bcrt1qmyk5tjvz68rzzsms7m3muacd96jf764eh7s9m8
Minerando blocos para gerar saldo...
[
  "3cbcdcc757413824714404e65478da5071450afdd4580127f98ca949853cd35e",
  ......,
  "676e764539b902dcbff86b2a7965c7fee808471d23e80d2fa1c97703d584ace1"
]
Enviando 1 BTC do remetente para o destinatário...
[
  "6f9b2e9a22ea62d41eb5e852d1eafd5611a6737c666d30fac3c64bf7369e65dd"
]
Saldo final do destinatário: 1.00000000 BTC
```

---

Explorar as diferentes redes do Bitcoin na prática permite entender com mais clareza como os nós funcionam, como os scripts interagem com a blockchain e quais ferramentas estão disponíveis em cada ambiente. Ao alternar entre mainnet, testnet, signet e regtest, é possível desenvolver, testar e validar operações com segurança e controle total. A partir daqui, o próximo passo é criar suas próprias ferramentas, simulações e automações sobre essas redes. 


