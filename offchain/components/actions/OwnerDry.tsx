import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { Spinner } from "@nextui-org/spinner";

import { AlwaysAbstain, AlwaysNoConfidence, Credential, DRep, isDRepCredential, PoolId } from "@lucid-evolution/lucid";
import { Action } from "@/types/action";

export default function OwnerDry(props: {
  onDeposit: Action;
  onWithdraw: Action;
  onDelegateStake: Action;
  onWithdrawStake: Action;
  onUnregisterStake: Action;
}) {
  const { onDeposit, onWithdraw, onDelegateStake, onWithdrawStake, onUnregisterStake } = props;

  function DepositButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [lovelace, setLovelace] = useState(0n);

    return (
      <>
        <Button onPress={onOpen} className="bg-gradient-to-tr from-primary-500 to-teal-500 text-white shadow-lg" radius="full">
          Deposit
        </Button>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Deposit</ModalHeader>
                <ModalBody>
                  <Input
                    type="number"
                    label="Quantity"
                    placeholder="0.000000"
                    variant="bordered"
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">ADA</span>
                      </div>
                    }
                    onValueChange={(value: string) => setLovelace(BigInt(parseFloat(value) * 1_000000))}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    onClick={() => onDeposit(lovelace).then(onClose)}
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    radius="full"
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
    const AlwaysNoConfidence: AlwaysNoConfidence = { __typename: "AlwaysNoConfidence" };

    const [poolID, setPoolID] = useState<PoolId>("");
    const [dRep, setDrep] = useState<DRep>(AlwaysAbstain);
    const [dRepID, setDrepID] = useState(""); // drep_...
    const [dRepCredentialType, setDrepCredentialType] = useState<"Key" | "Script">("Key");
    const [dRepCredentialHash, setDrepCredentialHash] = useState("");

    useEffect(() => {
      if (!dRepID) return; // skip
      fetch(`/governance/dreps/${dRepID}`, { headers: { project_id: `${process.env.NEXT_PUBLIC_BF_PID}` } })
        .then((dRep) => dRep.json())
        .then(({ hex, has_script }) => {
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
        <Button onPress={onOpen} className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg" radius="full">
          Delegate Stake
        </Button>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Delegate Stake</ModalHeader>
                <ModalBody>
                  <Input label="Pool ID" placeholder="Enter Pool ID" variant="bordered" onValueChange={setPoolID} />
                  <Select
                    label="Drep"
                    placeholder="Abstain"
                    variant="bordered"
                    onChange={(e) => setDrep(e.target.value ? Drep[e.target.value]() : AlwaysAbstain)}
                  >
                    <SelectItem key={"AlwaysAbstain"}>Abstain</SelectItem>
                    <SelectItem key={"Credential"}>Credential</SelectItem>
                    <SelectItem key={"AlwaysNoConfidence"}>No confidence</SelectItem>
                  </Select>
                  {isDRepCredential(dRep) && <Input label="Drep ID" placeholder="drep_..." variant="bordered" onValueChange={setDrepID} />}
                </ModalBody>
                <ModalFooter>
                  <div className="relative">
                    <Button
                      onClick={() => onDelegateStake({ poolID, dRep }).then(onClose)}
                      isDisabled={isDRepCredential(dRep) && !dRepCredentialHash}
                      className={`bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg
                      ${isDRepCredential(dRep) && dRepID && !dRepCredentialHash && "invisible"}`}
                      radius="full"
                    >
                      Submit
                    </Button>
                    {isDRepCredential(dRep) && dRepID && !dRepCredentialHash && (
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

      <Button onClick={onWithdrawStake} className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg" radius="full">
        Withdraw Stake Rewards
      </Button>

      <Button onClick={onWithdraw} className="bg-gradient-to-tr from-primary-500 to-teal-500 text-white shadow-lg" radius="full">
        Withdraw from Spend
      </Button>

      <Button onClick={onUnregisterStake} className="bg-gradient-to-tr from-slate-500 to-emerald-500 text-white shadow-lg" radius="full">
        Deregister Stake
      </Button>
    </div>
  );
}
