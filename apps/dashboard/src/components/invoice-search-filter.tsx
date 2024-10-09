"use client";

import { generateInvoiceFilters } from "@/actions/ai/filters/generate-invoice-filters";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useI18n } from "@/locales/client";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { readStreamableValue } from "ai/rsc";
import { formatISO } from "date-fns";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";

const allowedStatuses = ["draft", "overdue", "paid", "unpaid", "cancelled"];

type Props = {
  customers?: {
    id: string | null;
    name: string | null;
  }[];
};

export function InvoiceSearchFilter({ customers: customersData }: Props) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { setParams, statuses, start, end, q, customers } = useInvoiceParams({
    shallow: false,
  });

  const t = useI18n();

  const statusFilters = allowedStatuses.map((status) => ({
    id: status,
    name: t(`invoice.status.${status}`),
  }));

  useHotkeys(
    "esc",
    () => {
      setPrompt("");
      setParams(null);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  useHotkeys("meta+f", (evt) => {
    evt.preventDefault();
    setIsOpen((prev) => !prev);
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setPrompt(value);
    } else {
      setParams(null);
      setPrompt("");
    }
  };

  const handleSubmit = async () => {
    setStreaming(true);

    const { object } = await generateInvoiceFilters(
      prompt,
      `Invoice payment statuses: ${statusFilters.map((filter) => filter.name).join(", ")}
       Customers: ${customersData?.map((customer) => customer.name).join(", ")}
      `,
    );

    let finalObject = {};

    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        finalObject = {
          ...finalObject,
          statuses: Array.isArray(partialObject?.statuses)
            ? partialObject?.statuses
            : partialObject?.statuses
              ? [partialObject.statuses]
              : null,
          customers:
            partialObject?.customers?.map(
              (name: string) =>
                customersData?.find((customer) => customer.name === name)?.id,
            ) ?? null,
          q: partialObject?.name ?? null,
        };
      }
    }

    setParams({
      q: null,
      ...finalObject,
    });

    setStreaming(false);
  };

  const filters = {
    q,
    end,
    start,
    statuses,
    customers,
  };

  const hasValidFilters = Object.values(filters).some(
    (value) => value !== null,
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex space-x-4 items-center">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search or filter"
            className="pl-9 w-full md:w-[350px] pr-8"
            value={prompt}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          <DropdownMenuTrigger asChild>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              type="button"
              className={cn(
                "absolute z-10 right-3 top-[10px] opacity-50 transition-opacity duration-300 hover:opacity-100",
                hasValidFilters && "opacity-100",
                isOpen && "opacity-100",
              )}
            >
              <Icons.Filter />
            </button>
          </DropdownMenuTrigger>
        </form>

        <FilterList
          filters={filters}
          loading={streaming}
          onRemove={setParams}
          statusFilters={statusFilters}
          members={customersData}
        />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CalendarMonth className="mr-2 h-4 w-4" />
              <span>Due Date</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                <Calendar
                  mode="range"
                  initialFocus
                  today={start ? new Date(start) : new Date()}
                  toDate={new Date()}
                  selected={{
                    from: start ? new Date(start) : undefined,
                    to: end ? new Date(end) : undefined,
                  }}
                  onSelect={({ from, to }) => {
                    setParams({
                      start: from
                        ? formatISO(from, { representation: "date" })
                        : null,
                      end: to
                        ? formatISO(to, { representation: "date" })
                        : null,
                    });
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Face className="mr-2 h-4 w-4" />
              <span>Customer</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {customersData?.map((customer) => (
                  <DropdownMenuCheckboxItem
                    key={customer.id}
                    onCheckedChange={() => {
                      setParams({
                        customers: filters?.customers?.includes(customer.id)
                          ? filters.customers.filter((s) => s !== customer.id)
                          : [...(filters?.customers ?? []), customer.id],
                      });
                    }}
                  >
                    {customer.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {/* <SelectTag
                  headless
                  onChange={(selected) => {
                    setFilters({
                      tags: filters?.tags?.includes(selected.slug)
                        ? filters.tags.filter((s) => s !== selected.slug)
                            .length > 0
                          ? filters.tags.filter((s) => s !== selected.slug)
                          : null
                        : [...(filters?.tags ?? []), selected.slug],
                    });
                  }}
                /> */}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}