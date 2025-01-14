import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons"; // Optional, you can use other icons as needed

const SearchBar = () => {
  const { search, setSearch, showSearch, toggleShowSearch } = useContext(ShopContext);

  if (!showSearch) return null;

  const handleClose = () => {
    setSearch(""); // Reset search
    toggleShowSearch(false); // Close SearchBar
  };

  return (
    <div className="bg-gray-50 border-b border-t border-gray-200 py-4 px-6">
      <div className="flex items-center justify-center max-w-2xl mx-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          aria-label="Search"
          className="ml-4 p-2 text-blue-500 hover:bg-blue-100 rounded-md"
        >
          <SearchIcon />
        </button>
        <button
          aria-label="Close search"
          onClick={handleClose}
          className="ml-2 p-2 text-gray-600 hover:bg-gray-200 rounded-md"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
