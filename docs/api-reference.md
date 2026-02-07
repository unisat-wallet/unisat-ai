# API Reference

Complete API reference for Unisat AI SDK.

## UniSatClient

### Constructor

```typescript
new UniSatClient(config: {
  apiKey: string;
  baseURL?: string;    // Default: https://open-api.unisat.io
  timeout?: number;    // Default: 30000ms
})
```

### Blockchain Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getBlock(heightOrHash)` | `number \| string` | `Promise<BlockInfo>` |
| `getTransaction(txid)` | `string` | `Promise<TxInfo>` |
| `getBalance(address)` | `string` | `Promise<BalanceInfo>` |
| `getUTXOs(address, limit?)` | `string, number?` | `Promise<UTXO[]>` |
| `getFeeEstimates()` | - | `Promise<FeeEstimates>` |

### BRC20 Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getBRC20TokenInfo(ticker)` | `string` | `Promise<BRC20TokenInfo>` |
| `getBRC20Balance(ticker, address)` | `string, string` | `Promise<BRC20Balance>` |

### Runes Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getRunesTokenInfo(runeId)` | `string` | `Promise<RunesTokenInfo>` |
| `getRunesBalance(runeId, address)` | `string, string` | `Promise<RunesBalance>` |

## Types

### BlockInfo

```typescript
interface BlockInfo {
  height: number;
  hash: string;
  time: number;
  size: number;
}
```

### TxInfo

```typescript
interface TxInfo {
  txid: string;
  blockHeight: number;
  blockTime: number;
  fee: number;
  inputs: TxInput[];
  outputs: TxOutput[];
}
```

### BalanceInfo

```typescript
interface BalanceInfo {
  btc: number;
  satoshi: number;
  confirmBalance: number;
  pendingBalance: number;
}
```

## Error Handling

```typescript
import { UniSatAPIError } from "@unisat-ai/sdk";

try {
  const balance = await client.getBalance(address);
} catch (error) {
  if (error instanceof UniSatAPIError) {
    console.error(`API Error ${error.code}: ${error.message}`);
  }
}
```
