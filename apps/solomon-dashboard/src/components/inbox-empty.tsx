import { getInboxEmail } from "@midday/inbox";
import { Icons } from "@midday/ui/icons";
import { CopyInput } from "./copy-input";

type Props = {
  inboxId: string;
};

export function InboxEmpty({ inboxId }: Props) {
  return (
    <div className="h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="flex flex-col items-center w-[330px]">
        <Icons.InboxEmpty className="mb-4 w-[35px] h-[35px]" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Magic Inbox</h2>
          <p className="text-[#606060] text-sm">
            Use this email to send invoices and receipts to Midday. We will
            extract and reconcile them against transactions. Additionally, you
            can search based on the information within them.
            <br />
          </p>
        </div>

        <CopyInput value={getInboxEmail(inboxId)} />
      </div>
    </div>
  );
}
