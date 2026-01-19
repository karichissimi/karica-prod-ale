import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

export const SearchBar = ({ placeholder = "Cerca", onSearch, className }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div className={cn(
      "relative w-full transition-all duration-300",
      isFocused && "scale-[1.02]",
      className
    )}>
      <Search className={cn(
        "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300",
        isFocused ? "text-primary" : "text-muted-foreground"
      )} />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "pl-8 pr-3 py-1.5 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary h-8 rounded-lg text-sm transition-all duration-300",
          isFocused && "bg-muted shadow-sm"
        )}
      />
    </div>
  );
};
