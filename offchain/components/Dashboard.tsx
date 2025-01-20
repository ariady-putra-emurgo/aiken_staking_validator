import { Accordion, AccordionItem } from "@nextui-org/accordion";
import {
  Address,
  applyParamsToScript,
  credentialToRewardAddress,
  Data,
  DRep,
  getAddressDetails,
  Lovelace,
  LucidEvolution,
  paymentCredentialOf,
  PoolId,
  RedeemerBuilder,
  scriptHashToCredential,
  SpendingValidator,
  TxSignBuilder,
  UTxO,
  Validator,
  validatorToAddress,
  validatorToRewardAddress,
  validatorToScriptHash,
} from "@lucid-evolution/lucid";

import OwnerDry from "./actions/OwnerDry";
import Withdraw0 from "./actions/Withdraw0";

import { ActionGroup } from "@/types/action";
import {
  SpendValidatorDatumType,
  SpendValidatorRedeemer,
  StakeValidatorRedeemerType,
} from "@/types/withdraw0";
import { network } from "@/config/lucid";
import * as Script from "@/config/script";

export default function Dashboard(props: {
  lucid: LucidEvolution;
  address: Address;
  setActionResult: (result: string) => void;
  onError: (error: any) => void;
}) {
  const { lucid, address, setActionResult, onError } = props;

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  const actions: Record<string, ActionGroup> = {
    Owner: {
      deposit: async (lovelace: Lovelace) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script: Script.SpendOwner,
          };
          const validatorAddress = validatorToAddress(
            network,
            spendingValidator,
            stakingCredential,
          );

          const tx = await lucid
            .newTx()
            .pay.ToAddress(validatorAddress, { lovelace })
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script: Script.SpendOwner,
          };
          const validatorAddress = validatorToAddress(
            network,
            spendingValidator,
            stakingCredential,
          );

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .collectFrom(utxos, redeemer)
            .attach.SpendingValidator(spendingValidator)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      delegateStake: async ({
        poolID,
        dRep,
      }: {
        poolID: PoolId;
        dRep: DRep;
      }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .registerAndDelegate.ToPoolAndDRep(
              stakingAddress,
              poolID,
              dRep,
              redeemer,
            )
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdrawStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const accounts = await fetch(
            "/koios/account_info?select=rewards_available",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ _stake_addresses: [stakingAddress] }),
            },
          );
          const [{ rewards_available }] = await accounts.json();

          if (!rewards_available || rewards_available == 0)
            throw "No stake rewards yet!";

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .withdraw(stakingAddress, BigInt(rewards_available), redeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      unregisterStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .deRegisterStake(stakingAddress, redeemer)
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    DRY: {
      deposit: async (lovelace: Lovelace) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script: Script.SpendDRY,
          };
          const validatorAddress = validatorToAddress(
            network,
            spendingValidator,
            stakingCredential,
          );

          const tx = await lucid
            .newTx()
            .pay.ToAddress(validatorAddress, { lovelace })
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script: Script.SpendDRY,
          };
          const validatorAddress = validatorToAddress(
            network,
            spendingValidator,
            stakingCredential,
          );

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .collectFrom(utxos, redeemer)
            .attach.SpendingValidator(spendingValidator)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      delegateStake: async ({
        poolID,
        dRep,
      }: {
        poolID: PoolId;
        dRep: DRep;
      }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .registerAndDelegate.ToPoolAndDRep(
              stakingAddress,
              poolID,
              dRep,
              redeemer,
            )
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdrawStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const accounts = await fetch(
            "/koios/account_info?select=rewards_available",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ _stake_addresses: [stakingAddress] }),
            },
          );
          const [{ rewards_available }] = await accounts.json();

          if (!rewards_available || rewards_available == 0)
            throw "No stake rewards yet!";

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .withdraw(stakingAddress, BigInt(rewards_available), redeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      unregisterStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = {
            type: "PlutusV3",
            script: stakingScript,
          };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .deRegisterStake(stakingAddress, redeemer)
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    Withdraw0: {
      create: async ({
        spendableAfter,
        spendableBy,
      }: {
        spendableAfter: bigint;
        spendableBy: Address;
      }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script,
          };
          const validatorAddress = validatorToAddress(
            network,
            spendingValidator,
            stakingCredential,
          );

          const spendValidatorDatum: SpendValidatorDatumType = {
            spendableAfter,
            spendableBy: `${getAddressDetails(spendableBy).paymentCredential?.hash}`,
          };
          const datum = Data.to(spendValidatorDatum, SpendValidatorDatumType);

          const tx = await lucid
            .newTx()
            .pay.ToContract(validatorAddress, { kind: "inline", value: datum })
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      deposit: async ({
        inputUTXOs,
        outputLovelaces,
      }: {
        inputUTXOs: UTxO[];
        outputLovelaces: Lovelace[];
      }) => {
        try {
          if (outputLovelaces.length != inputUTXOs.length)
            throw "outputLovelaces.length != inputUTXOs.length";

          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);
          const stakingAddress = credentialToRewardAddress(
            network,
            stakingCredential,
          );

          const spendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script,
          };

          const spendValidatorRedeemer = SpendValidatorRedeemer.In;
          const stakeValidatorRedeemer: RedeemerBuilder = {
            kind: "selected",
            makeRedeemer: (inputIdxs: bigint[]) =>
              Data.to(
                {
                  inputIdxs, // [bigint]
                  outputIdxs: inputIdxs.map((_, i) => {
                    return BigInt(i); // convert number to bigint
                  }),
                },
                StakeValidatorRedeemerType, // { [inputIdx], [outputIdx] }
              ),
            inputs: inputUTXOs,
          };

          let newTx = lucid.newTx();

          inputUTXOs.forEach(({ address, datum, scriptRef }, i) => {
            newTx = newTx.pay.ToContract(
              address,
              { kind: "inline", value: `${datum}` },
              { lovelace: outputLovelaces[i] },
              scriptRef ?? undefined,
            );
          });

          const accounts = await fetch(
            "/koios/account_info?select=rewards_available",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ _stake_addresses: [stakingAddress] }),
            },
          );
          const [{ rewards_available }] = await accounts.json();
          // we could no-longer simply withdraw zero; if rewards have been accumulated we would have to withdraw the accumulated amount of rewards
          // https://github.com/Anastasia-Labs/design-patterns/blob/main/stake-validator/STAKE-VALIDATOR-TRICK.md#important-considerations
          const tx = await newTx
            .collectFrom(inputUTXOs, spendValidatorRedeemer)
            .attach.SpendingValidator(spendingValidator)
            .withdraw(
              stakingAddress,
              BigInt(rewards_available),
              stakeValidatorRedeemer,
            )
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async (fromSender: Address) => {
        try {
          //#region Sender
          const senderPKH = paymentCredentialOf(fromSender).hash;
          const senderScript = applyParamsToScript(Script.Withdraw0, [
            senderPKH,
          ]);

          const senderStakingValidator: Validator = {
            type: "PlutusV3",
            script: senderScript,
          };
          const senderStakingScriptHash = validatorToScriptHash(
            senderStakingValidator,
          );
          const senderStakingCredential = scriptHashToCredential(
            senderStakingScriptHash,
          );

          const senderSpendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script: senderScript,
          };
          const senderValidatorAddress = validatorToAddress(
            network,
            senderSpendingValidator,
            senderStakingCredential,
          );
          //#endregion

          //#region Own
          const ownPKH = paymentCredentialOf(address).hash;
          const ownScript = applyParamsToScript(Script.Withdraw0, [ownPKH]);

          const ownStakingValidator: Validator = {
            type: "PlutusV3",
            script: ownScript,
          };
          const ownStakingScriptHash =
            validatorToScriptHash(ownStakingValidator);
          const ownStakingCredential =
            scriptHashToCredential(ownStakingScriptHash);

          const ownSpendingValidator: SpendingValidator = {
            type: "PlutusV3",
            script: ownScript,
          };
          const ownValidatorAddress = validatorToAddress(
            network,
            ownSpendingValidator,
            ownStakingCredential,
          );
          //#endregion

          const blocks = await fetch("/koios/tip?select=block_time");
          const [{ block_time }] = await blocks.json();
          const now = block_time * 1_000;

          const utxos = (await lucid.utxosAt(senderValidatorAddress)).filter(
            ({ datum }) => {
              if (senderValidatorAddress === ownValidatorAddress) return !datum;
              if (!datum) return false;

              const { /* spendableAfter, */ spendableBy } = Data.from(
                datum,
                SpendValidatorDatumType,
              );

              return /* now > spendableAfter && */ ownPKH === spendableBy;
            },
          );

          const tx = await lucid
            .newTx()
            .collectFrom(utxos, SpendValidatorRedeemer.Out)
            .attach.SpendingValidator(senderSpendingValidator)
            .addSigner(address)
            .validFrom(now)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      delegateStake: async ({
        poolID,
        dRep,
      }: {
        poolID: PoolId;
        dRep: DRep;
      }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const stakeValidatorRedeemer: StakeValidatorRedeemerType = {
            inputIdxs: [],
            outputIdxs: [],
          };
          const redeemer = Data.to(
            stakeValidatorRedeemer,
            StakeValidatorRedeemerType,
          );

          const tx = await lucid
            .newTx()
            .registerAndDelegate.ToPoolAndDRep(
              stakingAddress,
              poolID,
              dRep,
              redeemer,
            )
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdrawStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const accounts = await fetch(
            "/koios/account_info?select=rewards_available",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ _stake_addresses: [stakingAddress] }),
            },
          );
          const [{ rewards_available }] = await accounts.json();

          if (!rewards_available || rewards_available == 0)
            throw "No stake rewards yet!";

          const stakeValidatorRedeemer: StakeValidatorRedeemerType = {
            inputIdxs: [],
            outputIdxs: [],
          };
          const redeemer = Data.to(
            stakeValidatorRedeemer,
            StakeValidatorRedeemerType,
          );

          const tx = await lucid
            .newTx()
            .withdraw(stakingAddress, BigInt(rewards_available), redeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      unregisterStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingAddress = validatorToRewardAddress(
            network,
            stakingValidator,
          );

          const stakeValidatorRedeemer: StakeValidatorRedeemerType = {
            inputIdxs: [],
            outputIdxs: [],
          };
          const redeemer = Data.to(
            stakeValidatorRedeemer,
            StakeValidatorRedeemerType,
          );

          const tx = await lucid
            .newTx()
            .deRegisterStake(stakingAddress, redeemer)
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete({ localUPLCEval: false });

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <span>{address}</span>

      <Accordion variant="splitted">
        {/* Owner */}
        <AccordionItem key="1" aria-label="Accordion 1" title="Owner">
          <OwnerDry
            onDelegateStake={actions.Owner.delegateStake}
            onDeposit={actions.Owner.deposit}
            onUnregisterStake={actions.Owner.unregisterStake}
            onWithdraw={actions.Owner.withdraw}
            onWithdrawStake={actions.Owner.withdrawStake}
          />
        </AccordionItem>

        {/* DRY */}
        <AccordionItem key="2" aria-label="Accordion 2" title="DRY">
          <OwnerDry
            onDelegateStake={actions.DRY.delegateStake}
            onDeposit={actions.DRY.deposit}
            onUnregisterStake={actions.DRY.unregisterStake}
            onWithdraw={actions.DRY.withdraw}
            onWithdrawStake={actions.DRY.withdrawStake}
          />
        </AccordionItem>

        {/* Withdraw0 */}
        <AccordionItem
          key="3"
          aria-label="Accordion 3"
          title="Withdraw Zero Trick"
        >
          <Withdraw0
            address={address}
            lucid={lucid}
            onCreate={actions.Withdraw0.create}
            onDelegateStake={actions.Withdraw0.delegateStake}
            onDeposit={actions.Withdraw0.deposit}
            onError={onError}
            onUnregisterStake={actions.Withdraw0.unregisterStake}
            onWithdraw={actions.Withdraw0.withdraw}
            onWithdrawStake={actions.Withdraw0.withdrawStake}
          />
        </AccordionItem>
      </Accordion>
    </div>
  );
}
