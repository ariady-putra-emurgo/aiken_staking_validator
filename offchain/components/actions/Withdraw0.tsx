import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { DatePicker } from "@nextui-org/date-picker";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { Spinner } from "@nextui-org/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import * as IntrDate from "@internationalized/date";
import {
  Address,
  AlwaysAbstain,
  AlwaysNoConfidence,
  applyParamsToScript,
  Credential,
  Data,
  DRep,
  isDRepCredential,
  Lovelace,
  LucidEvolution,
  paymentCredentialOf,
  PoolId,
  scriptHashToCredential,
  SpendingValidator,
  UTxO,
  Validator,
  validatorToAddress,
  validatorToScriptHash,
} from "@lucid-evolution/lucid";

import { network } from "@/config/lucid";
import * as Script from "@/config/script";
import { SpendValidatorDatumType } from "@/types/withdraw0";
import { Action } from "@/types/action";

export default function Withdraw0(props: {
  lucid: LucidEvolution;
  address: Address;
  onCreate: Action;
  onDeposit: Action;
  onWithdraw: Action;
  onDelegateStake: Action;
  onWithdrawStake: Action;
  onUnregisterStake: Action;
  onError: (error: any) => void;
}) {
  const {
    lucid,
    address,
    onCreate,
    onDeposit,
    onWithdraw,
    onDelegateStake,
    onWithdrawStake,
    onUnregisterStake,
    onError,
  } = props;

  function CreateButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const localTimeZone = IntrDate.getLocalTimeZone();
    const [now, setNow] = useState(IntrDate.now(localTimeZone));

    const [spendableAfter, setSpendableAfter] = useState(
      BigInt(now.toDate().getTime()),
    );
    const [spendableBy, setSpendableBy] = useState("");

    useEffect(() => {
      fetch("/koios/tip?select=block_time")
        .then((blocks) => blocks.json())
        .then(([{ block_time }]) => {
          const now = IntrDate.fromAbsolute(block_time * 1_000, localTimeZone);

          setNow(now);

          const epochMS = now.toDate().getTime();

          setSpendableAfter(BigInt(epochMS));
        })
        .catch(onError);
    }, []);

    return (
      <>
        <Button
          className="bg-gradient-to-tr from-primary-500 to-teal-500 text-white shadow-lg"
          radius="full"
          onPress={onOpen}
        >
          Create
        </Button>

        <Modal
          isOpen={isOpen}
          placement="top-center"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Create
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="Beneficiary"
                    placeholder="addr_..."
                    variant="bordered"
                    onValueChange={setSpendableBy}
                  />
                  <DatePicker
                    hideTimeZone
                    showMonthAndYearPickers
                    defaultValue={now}
                    label="Deadline"
                    minValue={now}
                    variant="bordered"
                    onChange={(value) =>
                      setSpendableAfter((spendableAfter) =>
                        value
                          ? BigInt(value.toDate().getTime())
                          : spendableAfter,
                      )
                    }
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
                    onPress={() =>
                      onCreate({ spendableAfter, spendableBy })
                        .then(onClose)
                        .catch(onError)
                    }
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  function DepositButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [inputUTXOs, setInputUTXOs] = useState<UTxO[]>();

    useEffect(() => {
      const pkh = paymentCredentialOf(address).hash;
      const script = applyParamsToScript(Script.Withdraw0, [pkh]);

      const stakingValidator: Validator = { type: "PlutusV3", script };
      const stakingScriptHash = validatorToScriptHash(stakingValidator);
      const stakingCredential = scriptHashToCredential(stakingScriptHash);

      const spendingValidator: SpendingValidator = { type: "PlutusV3", script };
      const validatorAddress = validatorToAddress(
        network,
        spendingValidator,
        stakingCredential,
      );

      lucid.utxosAt(validatorAddress).then(setInputUTXOs).catch(onError);
    }, []);

    async function collectDeposit() {
      const outputLovelaces: Lovelace[] = [];

      inputUTXOs?.forEach(({ assets }, u) => {
        let lovelace = 0n;

        try {
          const { value } = document.getElementById(
            `utxo.${u}.qty`,
          ) as HTMLInputElement;

          lovelace = BigInt(parseFloat(value) * 1_000000);
        } finally {
          outputLovelaces.push(assets.lovelace + lovelace);
        }
      });

      return { inputUTXOs, outputLovelaces };
    }

    return (
      <>
        <Button
          className="bg-gradient-to-tr from-primary-500 to-teal-500 text-white shadow-lg"
          radius="full"
          onPress={onOpen}
        >
          Deposit
        </Button>

        <Modal
          isOpen={isOpen}
          placement="top-center"
          size="5xl"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Deposit
                </ModalHeader>
                <ModalBody>
                  {inputUTXOs ? (
                    <Table isStriped aria-label="Deposit">
                      <TableHeader>
                        <TableColumn>Tx Hash</TableColumn>
                        <TableColumn>Output Index</TableColumn>
                        <TableColumn>Beneficiary</TableColumn>
                        <TableColumn>Deadline</TableColumn>
                        <TableColumn>ADA</TableColumn>
                        <TableColumn>Add</TableColumn>
                      </TableHeader>
                      <TableBody emptyContent="No rows to display.">
                        {inputUTXOs
                          .filter(({ datum }) => datum)
                          .map(({ txHash, outputIndex, datum, assets }, u) => {
                            if (!datum) return <></>;

                            const { spendableAfter, spendableBy } = Data.from(
                              datum,
                              SpendValidatorDatumType,
                            );
                            const deadline = new Date(
                              parseInt(spendableAfter.toString()),
                            );

                            return (
                              <TableRow key={`utxo.${u}`}>
                                <TableCell>{`${txHash.slice(0, 4)}...${txHash.slice(-4)}`}</TableCell>
                                <TableCell>{outputIndex}</TableCell>
                                <TableCell>{`${spendableBy.slice(0, 4)}...${spendableBy.slice(-4)}`}</TableCell>
                                <TableCell>{`${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}`}</TableCell>
                                <TableCell>{`${assets.lovelace / 1_000000n}.${assets.lovelace % 1_000000n}`}</TableCell>
                                <TableCell>
                                  <Input
                                    id={`utxo.${u}.qty`}
                                    label="Quantity"
                                    placeholder="0.000000"
                                    startContent={
                                      <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">
                                          ADA
                                        </span>
                                      </div>
                                    }
                                    type="number"
                                    variant="bordered"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  ) : (
                    <Spinner />
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
                    onPress={() =>
                      collectDeposit()
                        .then(onDeposit)
                        .then(onClose)
                        .catch(onError)
                    }
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  function WithdrawButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [fromSender, setSenderAddress] = useState<Address>(""); // addr_...

    return (
      <>
        <Button
          className="bg-gradient-to-tr from-primary-500 to-teal-500 text-white shadow-lg"
          radius="full"
          onPress={onOpen}
        >
          Withdraw from Spend
        </Button>

        <Modal
          isOpen={isOpen}
          placement="top-center"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Withdraw
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="Sender address"
                    placeholder="addr_..."
                    variant="bordered"
                    onValueChange={setSenderAddress}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
                    onPress={() =>
                      onWithdraw(fromSender).then(onClose).catch(onError)
                    }
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  function DelegateStakeButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const AlwaysAbstain: AlwaysAbstain = { __typename: "AlwaysAbstain" };
    const AlwaysNoConfidence: AlwaysNoConfidence = {
      __typename: "AlwaysNoConfidence",
    };

    const [poolID, setPoolID] = useState<PoolId>("");
    const [dRep, setDrep] = useState<DRep>(AlwaysAbstain);
    const [dRepID, setDrepID] = useState(""); // drep_...
    const [dRepCredentialType, setDrepCredentialType] = useState<
      "Key" | "Script"
    >("Key");
    const [dRepCredentialHash, setDrepCredentialHash] = useState("");

    useEffect(() => {
      if (!dRepID) return; // skip
      fetch("/koios/drep_info?select=hex,has_script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _drep_ids: [dRepID] }),
      })
        .then((dReps) => dReps.json())
        .then(([{ hex, has_script }]) => {
          const credential: Credential = {
            type: has_script ? "Script" : "Key",
            hash: hex,
          };

          setDrepCredentialType(credential.type);
          setDrepCredentialHash(credential.hash);
          setDrep(credential);
        })
        .catch(console.error);
    }, [dRepID]);

    const Drep: Record<string, () => DRep> = {
      AlwaysAbstain: () => AlwaysAbstain,
      Credential: () => {
        const credential: Credential = {
          type: dRepCredentialType,
          hash: dRepCredentialHash,
        };

        return credential;
      },
      AlwaysNoConfidence: () => AlwaysNoConfidence,
    };

    return (
      <>
        <Button
          className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg"
          radius="full"
          onPress={onOpen}
        >
          Delegate Stake
        </Button>

        <Modal
          isOpen={isOpen}
          placement="top-center"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Delegate Stake
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="Pool ID"
                    placeholder="Enter Pool ID"
                    variant="bordered"
                    onValueChange={setPoolID}
                  />
                  <Select
                    label="Drep"
                    placeholder="Abstain"
                    variant="bordered"
                    onChange={(e) =>
                      setDrep(
                        e.target.value ? Drep[e.target.value]() : AlwaysAbstain,
                      )
                    }
                  >
                    <SelectItem key={"AlwaysAbstain"}>Abstain</SelectItem>
                    <SelectItem key={"Credential"}>Credential</SelectItem>
                    <SelectItem key={"AlwaysNoConfidence"}>
                      No confidence
                    </SelectItem>
                  </Select>
                  {isDRepCredential(dRep) && (
                    <Input
                      label="Drep ID"
                      placeholder="drep_..."
                      variant="bordered"
                      onValueChange={setDrepID}
                    />
                  )}
                </ModalBody>
                <ModalFooter>
                  <div className="relative">
                    <Button
                      className={`bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg
                      ${isDRepCredential(dRep) && dRepID && !dRepCredentialHash && "invisible"}`}
                      isDisabled={isDRepCredential(dRep) && !dRepCredentialHash}
                      radius="full"
                      onPress={() =>
                        onDelegateStake({ poolID, dRep })
                          .then(onClose)
                          .catch(onError)
                      }
                    >
                      Submit
                    </Button>
                    {isDRepCredential(dRep) &&
                      dRepID &&
                      !dRepCredentialHash && (
                        <Spinner className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <DelegateStakeButton />

      <CreateButton />

      <DepositButton />

      <Button
        className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg"
        radius="full"
        onPress={onWithdrawStake}
      >
        Withdraw Stake Rewards
      </Button>

      <WithdrawButton />

      <Button
        className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg"
        radius="full"
        onPress={onUnregisterStake}
      >
        Deregister Stake
      </Button>
    </div>
  );
}
