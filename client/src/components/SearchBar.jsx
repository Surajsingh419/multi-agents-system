import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch, disabled }) {
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const q = input.trim();
    if (q && !disabled) {
      onSearch(q);
    }
  }

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          id="search-input"
          className="search-input"
          type="text"
          placeholder="What would you like to research? e.g. 'AI trends in 2026'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          autoFocus
        />
        <button
          id="search-button"
          className="search-button"
          type="submit"
          disabled={disabled || !input.trim()}
        >
          {disabled ? (
            <>
              <span className="spinner" /> Researching...
            </>
          ) : (
            <>
              <Search size={16} /> Research
            </>
          )}
        </button>
      </form>
    </div>
  );
}
