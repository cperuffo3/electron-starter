"use client";

import {
  faCalendar,
  faChevronDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";

export interface DatePickerProps {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  clearable = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted",
              clearable && value && "pr-8",
              className,
            )}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
              {value ? value.toLocaleDateString() : placeholder}
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="h-4 w-4 opacity-50"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleClear}
          aria-label="Clear date"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
