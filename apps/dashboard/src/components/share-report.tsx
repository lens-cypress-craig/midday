"use client";

import { createReportAction } from "@/actions/report/create-report-action";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CopyInput } from "./copy-input";

export function ShareReport({ defaultValue, type }) {
  const [isOpen, setOpen] = useState(false);
  const { toast, dismiss } = useToast();

  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? defaultValue.from;
  const to = searchParams?.get("to") ?? defaultValue.to;

  const createReport = useAction(createReportAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
    onSuccess: (data) => {
      setOpen(false);

      const { id } = toast({
        title: "Report published",
        description: "Your report is ready to share.",
        variant: "success",
        footer: (
          <div className="mt-4 space-x-2 flex w-full">
            <CopyInput
              value={data.short_link}
              className="border-[#2C2C2C] w-full"
            />

            <Link href={data.short_link} onClick={() => dismiss(id)}>
              <Button>View</Button>
            </Link>
          </div>
        ),
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Share
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <div className="p-4 space-y-8">
          <DialogHeader>
            <DialogTitle>Share report</DialogTitle>
            <DialogDescription>
              Publish the chosen period and then you can share it whit the
              unique URL.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              disabled={createReport.status === "executing"}
              className="w-full"
              onClick={() =>
                createReport.execute({
                  baseUrl: window.location.origin,
                  from,
                  to,
                  type,
                })
              }
            >
              {createReport.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}