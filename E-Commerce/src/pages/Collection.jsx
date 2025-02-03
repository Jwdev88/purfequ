import React, { useContext, useMemo, useReducer, useState, useCallback,useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import Pagination from "../components/Pagination"; // Tailwind Pagination component
import { debounce } from "lodash"; // Import debounce from lodash
import { Loader } from "lucide-react"; // Import Loader for loading state

// Initial state for filters
const initialState = {
  selectedCategory: [],
  selectedSubCategory: [],
  sortType: "",
};

// Reducer function for managing filters
const reducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_CATEGORY":
      return {
        ...state,
        selectedCategory: state.selectedCategory.includes(action.payload)
          ? state.selectedCategory.filter((cat) => cat !== action.payload)
          : [...state.selectedCategory, action.payload],
      };
    case "TOGGLE_SUBCATEGORY":
      return {
        ...state,
        selectedSubCategory: state.selectedSubCategory.includes(action.payload)
          ? state.selectedSubCategory.filter((subCat) => subCat !== action.payload)
          : [...state.selectedSubCategory, action.payload],
      };
    case "SET_SORT_TYPE":
      return { ...state, sortType: action.payload };
    default:
      return state;
  }
};

const Collection = () => {
  const { products, categories, subCategories, search, showSearch, formatIDR, setSearch } =
    useContext(ShopContext);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const itemsPerPage = 10;

  // Create a debounced version of setSearch to limit how often it gets triggered
  const debouncedSetSearch = useCallback(
    debounce((value) => {
      setSearch(value);
    }, 700), // 700ms debounce
    []
  );

  // Filter products based on search, categories, subcategories, and sort type
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Step 1: Filter based on search
    if (showSearch && search) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Step 2: Filter based on selected categories
    if (state.selectedCategory.length > 0) {
      filtered = filtered.filter((item) => {
        const categoryName = item.category?.name || "";
        return state.selectedCategory.includes(categoryName);
      });
    }

    // Step 3: Filter based on selected subcategories
    if (state.selectedSubCategory.length > 0) {
      filtered = filtered.filter((item) => {
        const subCategoryName = item.subCategory?.name || "";
        return state.selectedSubCategory.includes(subCategoryName);
      });
    }

    // Step 4: Sorting
    if (state.sortType === "low-high") {
      return filtered.sort((a, b) => a.price - b.price);
    } else if (state.sortType === "high-low") {
      return filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [
    products,
    showSearch,
    search,
    state.selectedCategory,
    state.selectedSubCategory,
    state.sortType,
  ]);

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  // Toggle category selection
  const toggleCategory = (value) => {
    dispatch({ type: "TOGGLE_CATEGORY", payload: value });
  };

  // Toggle subcategory selection
  const toggleSubCategory = (value) => {
    dispatch({ type: "TOGGLE_SUBCATEGORY", payload: value });
  };

  // Handle loading and error states
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      // Simulate loading for better UX
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err) {
      setError("Terjadi kesalahan saat memuat produk.");
      setLoading(false);
    }
  }, [filteredProducts]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Filter Section */}
      <div className="min-w-60">
        <p className="my-2 text-xl flex items-center cursor-pointer gap-2 font-semibold">
          FILTERS
          <img
            className="h-3 sm:hidden"
            src={assets.dropdown_icon}
            alt="Filter icon"
          />
        </p>

        {/* Categories */}
        <div className="border border-gray-300 p-5 mt-6 rounded-lg shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-800">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={cat.name}
                    onChange={(e) => toggleCategory(e.target.value)}
                    className="rounded border-gray-300 focus:ring-indigo-500"
                  />
                  {cat.name}
                </label>
              ))
            ) : (
              <p>No categories available.</p>
            )}
          </div>
        </div>

        {/* Subcategories */}
        <div className="border border-gray-300 p-5 mt-6 rounded-lg shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-800">SUBCATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {subCategories && subCategories.length > 0 ? (
              subCategories.map((subCat) => (
                <label key={subCat._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={subCat.name}
                    onChange={(e) => toggleSubCategory(e.target.value)}
                    className="rounded border-gray-300 focus:ring-indigo-500"
                  />
                  {subCat.name}
                </label>
              ))
            ) : (
              <p>No subcategories available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Product Display Section */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />
          <select
            onChange={(e) =>
              dispatch({ type: "SET_SORT_TYPE", payload: e.target.value })
            }
            className="border border-gray-300 text-sm px-2 py-1 rounded focus:ring-indigo-500"
          >
            <option value="">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin w-8 h-8" />
            <p className="ml-2">Memuat produk...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-600 py-8">{error}</div>
        )}

        {/* Product Items */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((item) => (
                  <ProductItem
                    key={item._id}
                    name={item.name}
                    id={item._id}
                    price={formatIDR(item.price)} // Ensure price is formatted properly
                    image={item.image}
                  />
                ))
              ) : (
                <p className="text-center mt-4 text-lg col-span-full">
                  No products found for the selected filters.
                </p>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Collection;