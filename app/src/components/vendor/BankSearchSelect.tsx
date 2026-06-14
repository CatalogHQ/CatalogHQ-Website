import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PayoutBank } from "@/types/payout";

type BankSearchSelectProps = {
  banks: PayoutBank[];
  value: string;
  onValueChange: (bankCode: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

export default function BankSearchSelect({
  banks,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Search bank...",
  id,
}: BankSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedBank = banks.find((bank) => bank.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between font-normal",
            !selectedBank && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selectedBank ? selectedBank.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search banks..." />
          <CommandList>
            <CommandEmpty>No bank found.</CommandEmpty>
            <CommandGroup>
              {banks.map((bank) => (
                <CommandItem
                  key={bank.code}
                  value={`${bank.name} ${bank.code}`}
                  onSelect={() => {
                    onValueChange(bank.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === bank.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{bank.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
