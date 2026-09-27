"use client"
import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxProps {
  options: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  iconMap?: Record<string, string>
  renderIcon?: (value: string) => React.ReactNode
}

export function Combobox({ options, value, onValueChange, placeholder = "Select...", searchPlaceholder = "Search...", emptyText = "No results.", className, iconMap, renderIcon }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {value ? (
              <>
                {renderIcon && renderIcon(value)} {!renderIcon && iconMap && iconMap[value] && <span>{iconMap[value]}</span>}
                {value}
              </>
            ) : <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {renderIcon && renderIcon(option)} {!renderIcon && iconMap && iconMap[option] && <span className="mr-2">{iconMap[option]}</span>}
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Multi-select combobox with create-on-type
interface MultiComboboxProps {
  options: string[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  creatable?: boolean
  iconMap?: Record<string, string>
  renderIcon?: (value: string) => React.ReactNode
}

export function MultiCombobox({ options, value, onValueChange, placeholder = "Select...", searchPlaceholder = "Search or type...", className, creatable = false, iconMap, renderIcon }: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const allOptions = React.useMemo(() => {
    if (creatable && search && !options.includes(search) && !value.includes(search)) {
      return [...options, search]
    }
    return options
  }, [options, search, value, creatable])

  const toggle = (option: string) => {
    const next = value.includes(option) ? value.filter((v) => v !== option) : [...value, option]
    onValueChange(next)
  }

  const remove = (option: string) => {
    onValueChange(value.filter((v) => v !== option))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal min-h-9"
          >
            <span className="text-muted-foreground text-sm">{placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
          <Command>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {creatable && search ? (
                  <button
                    className="text-sm text-violet-600 hover:underline"
                    onClick={() => { toggle(search); setSearch(""); }}
                  >
                    + Add &quot;{search}&quot;
                  </button>
                ) : "No results."}
              </CommandEmpty>
              <CommandGroup>
                {allOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => { toggle(option); setSearch("") }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value.includes(option) ? "opacity-100" : "opacity-0")} />
                    {renderIcon && renderIcon(option)} {!renderIcon && iconMap && iconMap[option] && <span className="mr-2">{iconMap[option]}</span>}
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2.5 py-0.5 text-xs font-medium">
              {renderIcon && renderIcon(v)} {!renderIcon && iconMap && iconMap[v] && <span>{iconMap[v]}</span>}
              {v}
              <button onClick={() => remove(v)} className="hover:text-violet-900 dark:hover:text-violet-100"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
