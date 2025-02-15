import { H3 } from "@/app/components/util/Headers";
import { useTokenBoundSDK } from "@/app/hooks";
import { STRK_SEPOLIA, campaign_contract } from "@/app/utils/data";
import WithdrawIcon from "@/svgs/WithdrawIcon";
import { useAccount } from "@starknet-react/core";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { cairo } from "starknet";

type Props = {
  withdrawalFormOpen: boolean;
  setWithdrawalFormOpen: Dispatch<SetStateAction<boolean>>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  withdrawalInputs: {
    beneficiary: string;
    amount: string;
  };
  campaignAddress: string;
  availableBalance: number;
};

const WithdrawalForm = ({
  withdrawalFormOpen,
  setWithdrawalFormOpen,
  withdrawalInputs,
  handleChange,
  campaignAddress,
  availableBalance,
}: Props) => {
  const [tokenTransferredSuccessfully, setTokenTransferredSuccessfully] =
    useState<boolean | null>(null);
  const [disableSendBtn, setDisableSendBtn] = useState("enableButton");
  const [withdrawState, setWithdrawState] = useState<
    "Withdraw now" | "Processing Request..." | "Success!"
  >("Withdraw now");

  useEffect(() => {
    if (!withdrawalInputs.amount || !withdrawalInputs.beneficiary) {
      setDisableSendBtn("disableButton");
    } else {
      setDisableSendBtn("enableButton");
    }
    if (tokenTransferredSuccessfully === false) {
      setDisableSendBtn("disableButton");
    }
  }, [tokenTransferredSuccessfully, withdrawalInputs]);

  const { tokenbound } = useTokenBoundSDK();
  const { account } = useAccount();
  const handleWithdraw = async () => {
    try {
      setTokenTransferredSuccessfully(false);
      setWithdrawState("Processing Request...");
      const status = await tokenbound.transferERC20({
        tbaAddress: campaignAddress,
        contractAddress: STRK_SEPOLIA,
        recipient: withdrawalInputs.beneficiary,
        amount: cairo.uint256(Number(withdrawalInputs.amount) * 1e18),
      });

      if (account) {
        campaign_contract.connect(account);
        await campaign_contract.set_available_withdrawal(
          campaignAddress,
          cairo.uint256(
            (availableBalance - Number(withdrawalInputs.amount)) * 1e18
          )
        );
        setWithdrawState("Success!");
      }
    } catch (error) {
      console.log("there was an error withdrawing: ", error);
      setWithdrawState("Withdraw now");
    } finally {
      setTokenTransferredSuccessfully(null);
    }
  };
  return (
    <div
      className={`grid  overflow-hidden ${
        withdrawalFormOpen
          ? "grid-rows-[1fr] transition-all duration-300"
          : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden flex flex-col gap-4 mb-4">
        <H3 style="text-theme-green">Send STRK</H3>
        <div>
          <label htmlFor="">Beneficiary address:</label>
          <input
            onChange={handleChange}
            className="w-full bg-transparent border-solid border-[1px] border-gray-400 p-3 rounded-[10px] mt-2"
            type="text"
            placeholder="Enter wallet address"
            value={withdrawalInputs.beneficiary}
            name="beneficiary"
          />
        </div>
        <div>
          <label htmlFor="">Amount:</label>
          <input
            onChange={handleChange}
            className="w-full bg-transparent border-solid border-[1px] border-gray-400 p-3 rounded-[10px] mt-2"
            type="text"
            placeholder="Enter amount"
            value={withdrawalInputs.amount}
            name="amount"
          />
        </div>
        <button
          disabled={
            disableSendBtn === "disableButton" || withdrawState === "Success!"
          }
          onClick={() => {
            handleWithdraw();
          }}
          className={`w-full bg-theme-green p-2 rounded-[5px]  ${
            disableSendBtn === "disableButton"
              ? "opacity-50 !cursor-not-allowed"
              : "opacity-100 !cursor-pointer"
          } justify-center items-center text-white  gap-2 flex`}
        >
          <span>{withdrawState}</span>
          {withdrawState == "Withdraw now" && (
            <span className="text-theme-yellow">
              <WithdrawIcon />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default WithdrawalForm;
