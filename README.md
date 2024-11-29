# aiken_staking_validator

This showcase project contains 3 validators:

- `owner`
- `dry`
- `withdraw_0`

Install `pnpm` if you have not by running `npm i -g pnpm`, and then go to [`offchain`](./offchain):

- Run `pnpm i` if you have never run the `offchain`
- Run `pnpm dev` to run the `offchain`

Open http://localhost:3000

## `owner`

In this validator, we see `withdraw` and `publish` handlers.

## `dry`

Here, we utilize the `else` block of a validator.

## `withdraw_0`

This validator explores the concept of:

- **Transaction-level validation via withdraw-zero** by **AnastasiaLabs**: https://github.com/Anastasia-Labs/design-patterns/blob/main/stake-validator/STAKE-VALIDATOR.md#validating-the-business-logic-at-staking-validator
- **Redeemer Indexing Design Pattern** by **AnastasiaLabs**: https://github.com/Anastasia-Labs/design-patterns/blob/main/utxo-indexers/UTXO-INDEXERS.md#redeemer-indexing-design-pattern-enhancing-smart-contract-validation-on-cardano

We see how these 2 concepts can be combined together.
