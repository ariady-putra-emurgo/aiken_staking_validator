import { Accordion, AccordionItem } from "@nextui-org/accordion";

import * as Script from "@/types/script";
import { ActionGroup } from "@/types/action";
import OwnerDry from "./actions/OwnerDry";
import Withdraw0 from "./actions/Withdraw0";
import { SpendValidatorDatumType, SpendValidatorRedeemer, StakeValidatorRedeemerType } from "@/types/withdraw0";

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
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendOwner };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator, stakingCredential);

          const tx = await lucid.newTx().pay.ToAddress(validatorAddress, { lovelace }).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendOwner };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator, stakingCredential);

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const tx = await lucid.newTx().collectFrom(utxos, redeemer).attach.SpendingValidator(spendingValidator).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      delegateStake: async ({ poolID, dRep }: { poolID: PoolId; dRep: DRep }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .registerAndDelegate.ToPoolAndDRep(stakingAddress, poolID, dRep, redeemer)
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdrawStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const account = await fetch(`/accounts/${stakingAddress}`, { headers: { project_id: `${process.env.NEXT_PUBLIC_BF_PID}` } });
          const { withdrawable_amount } = await account.json();
          if (!withdrawable_amount || withdrawable_amount == 0n) throw "No stake reward yet!";

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .withdraw(stakingAddress, BigInt(withdrawable_amount), redeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      unregisterStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeOwner, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const redeemer = Data.void();

          const tx = await lucid.newTx().deRegisterStake(stakingAddress, redeemer).attach.CertificateValidator(stakingValidator).addSigner(address).complete();

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
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendDRY };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator, stakingCredential);

          const tx = await lucid.newTx().pay.ToAddress(validatorAddress, { lovelace }).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.SpendDRY };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator, stakingCredential);

          const utxos = await lucid.utxosAt(validatorAddress);
          const redeemer = Data.void();

          const tx = await lucid.newTx().collectFrom(utxos, redeemer).attach.SpendingValidator(spendingValidator).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      delegateStake: async ({ poolID, dRep }: { poolID: PoolId; dRep: DRep }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .registerAndDelegate.ToPoolAndDRep(stakingAddress, poolID, dRep, redeemer)
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdrawStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const account = await fetch(`/accounts/${stakingAddress}`, { headers: { project_id: `${process.env.NEXT_PUBLIC_BF_PID}` } });
          const { withdrawable_amount } = await account.json();
          if (!withdrawable_amount || withdrawable_amount == 0n) throw "No stake reward yet!";

          const redeemer = Data.void();

          const tx = await lucid
            .newTx()
            .withdraw(stakingAddress, BigInt(withdrawable_amount), redeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      unregisterStake: async () => {
        try {
          const pkh = paymentCredentialOf(address).hash;

          const stakingScript = applyParamsToScript(Script.StakeDRY, [pkh]);
          const stakingValidator: Validator = { type: "PlutusV3", script: stakingScript };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const redeemer = Data.void();

          const tx = await lucid.newTx().deRegisterStake(stakingAddress, redeemer).attach.CertificateValidator(stakingValidator).addSigner(address).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },

    Withdraw0: {
      create: async ({ spendableAfter, spendableBy }: { spendableAfter: bigint; spendableBy: Address }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script };
          const validatorAddress = validatorToAddress(lucid.config().network, spendingValidator, stakingCredential);

          const spendValidatorDatum: SpendValidatorDatumType = { spendableAfter, spendableBy: `${getAddressDetails(spendableBy).paymentCredential?.hash}` };
          const datum = Data.to(spendValidatorDatum, SpendValidatorDatumType);

          const tx = await lucid.newTx().pay.ToContract(validatorAddress, { kind: "inline", value: datum }).complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      deposit: async ({ inputUTXOs, outputLovelaces }: { inputUTXOs: UTxO[]; outputLovelaces: Lovelace[] }) => {
        try {
          if (outputLovelaces.length != inputUTXOs.length) throw "outputLovelaces.length != inputUTXOs.length";

          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingScriptHash = validatorToScriptHash(stakingValidator);
          const stakingCredential = scriptHashToCredential(stakingScriptHash);
          const stakingAddress = credentialToRewardAddress(lucid.config().network, stakingCredential);

          const spendingValidator: SpendingValidator = { type: "PlutusV3", script };

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
                StakeValidatorRedeemerType // { [inputIdx], [outputIdx] }
              ),
            inputs: inputUTXOs,
          };

          let newTx = lucid.newTx();
          inputUTXOs.forEach(({ address, datum, scriptRef }, i) => {
            newTx = newTx.pay.ToContract(address, { kind: "inline", value: `${datum}` }, { lovelace: outputLovelaces[i] }, scriptRef ?? undefined);
          });

          const tx = await newTx
            .collectFrom(inputUTXOs, spendValidatorRedeemer)
            .attach.SpendingValidator(spendingValidator)
            .withdraw(stakingAddress, 0n, stakeValidatorRedeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      withdraw: async (fromSender: Address) => {
        try {
          //#region Sender
          const senderPKH = paymentCredentialOf(fromSender).hash;
          const senderScript = applyParamsToScript(Script.Withdraw0, [senderPKH]);

          const senderStakingValidator: Validator = { type: "PlutusV3", script: senderScript };
          const senderStakingScriptHash = validatorToScriptHash(senderStakingValidator);
          const senderStakingCredential = scriptHashToCredential(senderStakingScriptHash);

          const senderSpendingValidator: SpendingValidator = { type: "PlutusV3", script: senderScript };
          const senderValidatorAddress = validatorToAddress(lucid.config().network, senderSpendingValidator, senderStakingCredential);
          //#endregion

          //#region Own
          const ownPKH = paymentCredentialOf(address).hash;
          const ownScript = applyParamsToScript(Script.Withdraw0, [ownPKH]);

          const ownStakingValidator: Validator = { type: "PlutusV3", script: ownScript };
          const ownStakingScriptHash = validatorToScriptHash(ownStakingValidator);
          const ownStakingCredential = scriptHashToCredential(ownStakingScriptHash);

          const ownSpendingValidator: SpendingValidator = { type: "PlutusV3", script: ownScript };
          const ownValidatorAddress = validatorToAddress(lucid.config().network, ownSpendingValidator, ownStakingCredential);
          //#endregion

          const block = await fetch("/blocks/latest", { headers: { project_id: `${process.env.NEXT_PUBLIC_BF_PID}` } });
          const { time } = await block.json();
          const now = time * 1_000;

          const utxos = (await lucid.utxosAt(senderValidatorAddress)).filter(({ datum }) => {
            if (senderValidatorAddress === ownValidatorAddress) return !datum;
            if (!datum) return false;

            const { spendableAfter, spendableBy } = Data.from(datum, SpendValidatorDatumType);
            return now > spendableAfter && ownPKH === spendableBy;
          });

          const tx = await lucid
            .newTx()
            .collectFrom(utxos, SpendValidatorRedeemer.Out)
            .attach.SpendingValidator(senderSpendingValidator)
            .addSigner(address)
            .validFrom(now)
            .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      delegateStake: async ({ poolID, dRep }: { poolID: PoolId; dRep: DRep }) => {
        try {
          const pkh = paymentCredentialOf(address).hash;
          const script = applyParamsToScript(Script.Withdraw0, [pkh]);

          const stakingValidator: Validator = { type: "PlutusV3", script };
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const stakeValidatorRedeemer: StakeValidatorRedeemerType = { inputIdxs: [], outputIdxs: [] };
          const redeemer = Data.to(stakeValidatorRedeemer, StakeValidatorRedeemerType);

          const tx = await lucid
            .newTx()
            .registerAndDelegate.ToPoolAndDRep(stakingAddress, poolID, dRep, redeemer)
            .attach.CertificateValidator(stakingValidator)
            .addSigner(address)
            .complete();

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
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const account = await fetch(`/accounts/${stakingAddress}`, { headers: { project_id: `${process.env.NEXT_PUBLIC_BF_PID}` } });
          const { withdrawable_amount } = await account.json();
          if (!withdrawable_amount || withdrawable_amount == 0n) throw "No stake reward yet!";

          const stakeValidatorRedeemer: StakeValidatorRedeemerType = { inputIdxs: [], outputIdxs: [] };
          const redeemer = Data.to(stakeValidatorRedeemer, StakeValidatorRedeemerType);

          const tx = await lucid
            .newTx()
            .withdraw(stakingAddress, BigInt(withdrawable_amount), redeemer)
            .attach.WithdrawalValidator(stakingValidator)
            .addSigner(address)
            .complete();

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
          const stakingAddress = validatorToRewardAddress(lucid.config().network, stakingValidator);

          const stakeValidatorRedeemer: StakeValidatorRedeemerType = { inputIdxs: [], outputIdxs: [] };
          const redeemer = Data.to(stakeValidatorRedeemer, StakeValidatorRedeemerType);

          const tx = await lucid.newTx().deRegisterStake(stakingAddress, redeemer).attach.CertificateValidator(stakingValidator).addSigner(address).complete();

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
            onDeposit={actions.Owner.deposit}
            onWithdraw={actions.Owner.withdraw}
            onDelegateStake={actions.Owner.delegateStake}
            onWithdrawStake={actions.Owner.withdrawStake}
            onUnregisterStake={actions.Owner.unregisterStake}
          />
        </AccordionItem>

        {/* DRY */}
        <AccordionItem key="2" aria-label="Accordion 2" title="DRY">
          <OwnerDry
            onDeposit={actions.DRY.deposit}
            onWithdraw={actions.DRY.withdraw}
            onDelegateStake={actions.DRY.delegateStake}
            onWithdrawStake={actions.DRY.withdrawStake}
            onUnregisterStake={actions.DRY.unregisterStake}
          />
        </AccordionItem>

        {/* Withdraw0 */}
        <AccordionItem key="3" aria-label="Accordion 3" title="Withdraw Zero Trick">
          <Withdraw0
            lucid={lucid}
            address={address}
            onCreate={actions.Withdraw0.create}
            onDeposit={actions.Withdraw0.deposit}
            onWithdraw={actions.Withdraw0.withdraw}
            onDelegateStake={actions.Withdraw0.delegateStake}
            onWithdrawStake={actions.Withdraw0.withdrawStake}
            onUnregisterStake={actions.Withdraw0.unregisterStake}
            onError={onError}
          />
        </AccordionItem>
      </Accordion>
    </div>
  );
}
