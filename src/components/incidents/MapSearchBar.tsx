import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MapSearchBarProps {
  onSelect: (result: { label: string; lat: number; lng: number }) => void;
  className?: string;
}

interface SearchResult {
  label: string;
  lat: number;
  lng: number;
  display: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function MapSearchBar({ onSelect, className }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&limit=5&countrycodes=us`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "emergency-response-platform/1.0",
            },
          }
        );
        const data = await res.json();
        const parsed: SearchResult[] = data.map(
          (item: { display_name: string; lat: string; lon: string }) => ({
            label: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            display: item.display_name,
          })
        );
        setResults(parsed);
        setShowResults(parsed.length > 0);
      } catch {
        setResults([]);
        setShowResults(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.label);
    setResults([]);
    setShowResults(false);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className={cn("relative z-30", className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <Input
          id="map-search"
          type="search"
          placeholder="Search location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= MIN_QUERY_LENGTH || results.length > 0) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowResults(false), 150);
          }}
          className="pl-10 pr-10"
        />
        {(query || isLoading) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            {isLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-critical-600 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
            Results
          </div>
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelect(result)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
                i === 0 ? "border-b border-slate-100" : ""
              )}
            >
              <MapPin className="h-4 w-4 text-critical-600" />
              <span className="text-slate-700 truncate">{result.display}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-500 text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
