import {Worker} from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './command';
import { WorkerResponse } from './AddRoleDialog';


type WorkerMultiSelectProps = {
  value: WorkerResponse[];                              
  onChange: (next: WorkerResponse[]) => void;           
  fetchWorkers: (q: string) => Promise<WorkerResponse[]>; 
  placeholder?: string;
  disabled?: boolean;
  inputAriaLabel?: string;
  multiOpen: boolean,
  setMultiOpen: (open: boolean) => void;
};

export function WorkerMultiSelect ({
  value,
  onChange,
  fetchWorkers,
  placeholder = "Search workers...",
  disabled,
  inputAriaLabel = "Search workers",
  multiOpen=false,
  setMultiOpen,
}: WorkerMultiSelectProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<WorkerResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!open || query.trim().length === 0) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
      setLoading(true);
      setError(null);
      try {
        const r = await fetchWorkers(query);
        if (!cancelled) setResults(r);
      } catch (e) {
        if (!cancelled) setError("Could not load workers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchWorkers, query, open]);

  const isSelected = useCallback(
    (id: number) => value.some((w) => w.id == id),
    [value]
  );

  const toggle = (w: Worker) => {
    if (isSelected(w.id)) {
      onChange(value.filter((x) => x.id != w.id));
    } else {
      onChange([...value, w]);
    }
  };

  const clearOne = (id: number) => onChange(value.filter((w) => w.id != id));
  const clearAll = () => onChange([]);

  return (
    <div className="w-full">
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((w) => (
            <Badge
              key={w.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{w.first_name + w.last_name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => clearOne(w.id)}
                aria-label={`Remove ${w.first_name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-6 px-2"
            onClick={clearAll}
            aria-label="Clear all workers"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Combobox trigger */}
      <Popover open={multiOpen} onOpenChange={setMultiOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between"
          >
            {value.length > 0
              ? `${value.length} selected`
              : "Select workers"}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--trigger-width,20rem)] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
              aria-label={inputAriaLabel}
              autoFocus
            />
            {loading && (
              <div className="flex items-center gap-2 p-2 text-sm opacity-70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}
            {error && (
              <div className="p-2 text-sm text-red-600">{error}</div>
            )}
            <CommandList className='max-h-[250px] overflow-y-auto'>
                <CommandEmpty>
                  {query ? "No results" : "Type to search"}
                </CommandEmpty>

              {/* Results */}
              {results.length > 0 && (
                <CommandGroup heading="Workers">
                    {results.map((w) => {
                      const selected = isSelected(w.id);
                      return (
                        <CommandItem
                          key={w.id}
                          value={String(w.id) ||"0"}
                          onSelect={() => toggle(w)}
                          aria-selected={selected}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selected ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {/* TODO: rethink how this displays */}
                          <div className="flex flex-col">
                            <span>{w.first_name}</span>
                            {w.last_name && (
                              <span className="text-xs opacity-70">{w.last_name}</span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>)}
              {value.length > 0 && (
                <>
                  <CommandSeparator />
                  <div className="p-2">
                    <Button
                      type="button"
                      onClick={() => {
                        clearAll();
                        setMultiOpen(false);
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      Clear selection
                    </Button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}