interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search places…"
        aria-label="Search places"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {query && (
        <button type="button" className="clear-search" onClick={() => onQueryChange("")} aria-label="Clear search">
          Clear
        </button>
      )}
    </div>
  );
}
