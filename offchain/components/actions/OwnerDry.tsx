import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
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
  AlwaysAbstain,
  AlwaysNoConfidence,
  Credential,
  DRep,
  isDRepCredential,
  PoolId,
} from "@lucid-evolution/lucid";

import { Action } from "@/types/action";

export default function OwnerDry(props: {
  onDeposit: Action;
  onWithdraw: Action;
  onDelegateStake: Action;
  onWithdrawStake: Action;
  onUnregisterStake: Action;
}) {
  const {
    onDeposit,
    onWithdraw,
    onDelegateStake,
    onWithdrawStake,
    onUnregisterStake,
  } = props;

  function DepositButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [lovelace, setLovelace] = useState(0n);

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
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Deposit
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="Quantity"
                    placeholder="0.000000"
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">ADA</span>
                      </div>
                    }
                    type="number"
                    variant="bordered"
                    onValueChange={(value: string) =>
                      setLovelace(BigInt(parseFloat(value) * 1_000000))
                    }
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
                    onPress={() => onDeposit(lovelace).then(onClose)}
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
                        onDelegateStake({ poolID, dRep }).then(onClose)
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

      <DepositButton />

      <Button
        className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg"
        radius="full"
        onPress={onWithdrawStake}
      >
        Withdraw Stake Rewards
      </Button>

      <Button
        className="bg-gradient-to-tr from-primary-500 to-teal-500 text-white shadow-lg"
        radius="full"
        onPress={onWithdraw}
      >
        Withdraw from Spend
      </Button>

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
