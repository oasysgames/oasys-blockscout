# Verified Contract Export/Import Tool
This tool is designed to export verified contracts from a running Blockscout and import them to another Blockscout host.

## Setup
```shell
cd ops/v4-to-v5/

npm install
```

## Export

```shell
export SRC_BLOCKSCOUT=https://explorer.example.com/
export OUTPUT=/tmp/verified-contracts.json

npx ts-node ./src/export-contracts.ts
```

## Import

```shell
export DST_BLOCKSCOUT=https://explorer.example.com/
export INPUT=/tmp/verified-contracts.json

npx ts-node ./src/import-contracts.ts
```
