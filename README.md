# aiken_staking_validator

This showcase project contains 3 validators:

- `owner`
- `dry`
- `withdraw_0`

To run the offchain:

1. Create a `.env.local` file
2. Run `pnpm dev`

Your `.env.local` file must contain:

```
NEXT_PUBLIC_BF_URL=https://cardano-preprod.blockfrost.io/api/v0
NEXT_PUBLIC_BF_PID=preprodYOUR_PREPROD_BLOCKFROST_PROJECT_ID
NEXT_PUBLIC_CARDANO_NETWORK=Preprod
```

To install `pnpm` run `npm i -g pnpm`.

## `owner`

In this validator, we see `withdraw` and `publish` handlers.

## `dry`

Here, we utilize the `else` block of a validator.

## `withdraw_0`

This validator explores the concept of:

- **Transaction-level validation via withdraw-zero** by **AnastasiaLabs**: https://github.com/Anastasia-Labs/design-patterns/blob/main/stake-validator/STAKE-VALIDATOR.md#validating-the-business-logic-at-staking-validator
- **Redeemer Indexing Design Pattern** by **AnastasiaLabs**: https://github.com/Anastasia-Labs/design-patterns/blob/main/utxo-indexers/UTXO-INDEXERS.md#redeemer-indexing-design-pattern-enhancing-smart-contract-validation-on-cardano

We see how these 2 concepts can be combined together.
