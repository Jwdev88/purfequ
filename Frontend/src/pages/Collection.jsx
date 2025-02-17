// --- components/Collection.jsx ---
import React, { useContext, useMemo, useReducer, useState, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import Pagination from "../components/Pagination";
import { debounce } from "lodash";
import { Loader2Icon, Filter, XCircle } from "lucide-react"; // Import icons

const initialState = {
    selectedCategory: null,
    selectedSubcategories: [],
    sortType: "",
};

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_CATEGORY":
            return {
                ...state,
                selectedCategory: action.payload,
                selectedSubcategories: [], // Reset subcategories
            };
        case "TOGGLE_SUBCATEGORY":
            return {
                ...state,
                selectedSubcategories: state.selectedSubcategories.includes(action.payload)
                    ? state.selectedSubcategories.filter((subCatId) => subCatId !== action.payload)
                    : [...state.selectedSubcategories, action.payload],
            };
        case "SET_SORT_TYPE":
            return { ...state, sortType: action.payload };
        case "RESET_FILTERS":
            return initialState;
        default:
            return state;
    }
};

const Collection = () => {
    const { products, categories, subCategories, search, showSearch, setSearch, isLoading } = useContext(ShopContext); // Get isLoading

    const [state, dispatch] = useReducer(reducer, initialState);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false); // Mobile filter visibility
    const itemsPerPage = 10;

    // Debounce the search input
    const debouncedSetSearch = useCallback(
        debounce((value) => {
            setSearch(value);
            setCurrentPage(1); // Reset to page 1 on search
        }, 500), // 500ms debounce
        [setSearch]
    );

     const setCategory = useCallback((categoryId) => {
        dispatch({ type: "SET_CATEGORY", payload: categoryId });
        setCurrentPage(1); // Reset to page 1 when filters change
    }, []);

    const toggleSubCategory = useCallback((subCategoryId) => {
        dispatch({ type: "TOGGLE_SUBCATEGORY", payload: subCategoryId });
        setCurrentPage(1); // Reset to page 1
    }, []);

    const resetFilters = useCallback(() => {
        dispatch({ type: "RESET_FILTERS" });
        setCurrentPage(1); // Reset to page 1
    }, []);

    const toggleMobileFilters = () => {
      setShowFilters(!showFilters);
    }

  // --- Get Relevant Subcategories ---
    const relevantSubcategories = useMemo(() => {
      if (!state.selectedCategory) {
        return []; // Return empty array if no category is selected
      }
      return subCategories.filter((subCat) => subCat.category === state.selectedCategory);
    }, [subCategories, state.selectedCategory]);

    // --- Efficient Filtering and Sorting (useMemo) ---
    const filteredProducts = useMemo(() => {
        if (!products) return [];

        return products.filter(product => {
            // Search filter
            if (showSearch && search && !product.name?.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            // Category filter
            if (state.selectedCategory && product.category !== state.selectedCategory) {
                return false;
            }
            // Subcategory filter
            if (state.selectedSubcategories.length > 0 && !state.selectedSubcategories.includes(product.subCategory)) {
                return false;
            }
            return true;

        }).sort((a, b) => {
            // --- Corrected Sorting Logic ---
            const getPriceForSort = (product) => {
                if (product.variants && product.variants.length > 0) {
                // Find the *minimum* option price.
                return product.variants.reduce((min, variant) => {
                    const optionPrices = variant.options.map((option) => option.price);
                    const variantMin = Math.min(...optionPrices);
                    return Math.min(min, variantMin);
                    }, Infinity);
                }
                return product.price ?? 0; // Handle missing price
            };

            const priceA = getPriceForSort(a);
            const priceB = getPriceForSort(b);

            if (state.sortType === "low-high") {
                return priceA - priceB;
            } else if (state.sortType === "high-low") {
                return priceB - priceA;
            }
            return 0; // No sorting (relevant)
            // --- End Corrected Sorting Logic ---
        });
    }, [products, showSearch, search, state.selectedCategory, state.selectedSubcategories, state.sortType]);


    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredProducts.slice(start, end);
    }, [filteredProducts, currentPage, itemsPerPage]);

    return (
        <div className="container mx-auto px-4 py-8">
            <Title text1={"ALL"} text2={"COLLECTIONS"} />

            <div className="flex flex-col md:flex-row gap-4">
                {/* Filter Section (Mobile Toggle) */}
                <div className="md:w-1/4">
                <button
                    onClick={toggleMobileFilters}
                    className="md:hidden w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    aria-expanded={showFilters}
                    aria-controls="filter-section"
                    >
                    <Filter className="h-5 w-5 mr-2" />
                    Filters
                    </button>

                <div
                    id="filter-section"
                    className={`${showFilters ? "block" : "hidden"} md:block md:w-64 `}
                >
                        <div className="border-b border-gray-200 py-4 md:border-none md:pt-0">
                            <h3 className="text-lg font-medium text-gray-900">
                                Filters
                                 <button onClick={resetFilters} className="md:hidden float-right">

                                    <XCircle className="h-5 w-5 text-gray-500 hover:text-gray-700" aria-label="Clear Filters" />

                                </button>
                            </h3>
                            {/* Categories */}
                            <div className="border border-gray-300 p-4 mt-4 rounded-lg shadow-sm">
                                <h4 className="mb-2 text-sm font-medium text-gray-800">CATEGORIES</h4>
                                <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                                {categories && categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <label key={cat._id} className="flex items-center gap-2" htmlFor={`category-${cat._id}`}>
                                            <input
                                                type="radio"
                                                id={`category-${cat._id}`}
                                                name="category"
                                                value={cat._id}
                                                checked={state.selectedCategory === cat._id}
                                                onChange={() => setCategory(cat._id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                             <span className={state.selectedCategory === cat._id ? "font-medium" : ""}>{cat.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p>No categories available.</p>
                                )}
                                </div>
                            </div>

                            {/* Subcategories (Conditional Rendering) */}
                            {state.selectedCategory && (
                                <div className="border border-gray-300 p-4 mt-4 rounded-lg shadow-sm">
                                    <h4 className="mb-2 text-sm font-medium text-gray-800">SUBCATEGORIES</h4>
                                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                                        {relevantSubcategories.length > 0 ? (
                                            relevantSubcategories.map((subCat) => (
                                                <label key={subCat._id} className="flex items-center gap-2" htmlFor={`subcategory-${subCat._id}`}>
                                                    <input
                                                        type="checkbox"
                                                        id={`subcategory-${subCat._id}`}
                                                        value={subCat._id}
                                                        checked={state.selectedSubcategories.includes(subCat._id)}
                                                        onChange={() => toggleSubCategory(subCat._id)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className={state.selectedSubcategories.includes(subCat._id) ? "font-medium" : ""}>{subCat.name}</span>

                                                </label>
                                            ))
                                        ) : (
                                            <p>No subcategories available for this category.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                             <button onClick={resetFilters} className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm w-full">
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
                {/* Product Display Section */}
                <div className="md:flex-1">
                    <div className="flex justify-end items-center mb-4">


                    {/* --- Sort Dropdown (CORRECTED POSITIONING) --- */}
                    <div className="relative"> {/* Add relative positioning */}
                        <select
                        onChange={(e) =>
                            dispatch({ type: "SET_SORT_TYPE", payload: e.target.value })
                        }
                        className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        aria-label="Sort products"
                        >
                        <option value="">Sort by: Relevant</option>
                        <option value="low-high">Sort by: Low to High</option>
                        <option value="high-low">Sort by: High to Low</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2Icon className="animate-spin h-10 w-10 text-indigo-600" />
              <p className="ml-2 text-lg text-gray-700">Loading products...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
                    <ProductItem
                      key={product._id}
                      product={product}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-600 mt-4 col-span-full">
                    No products found for the selected filters.
                  </p>
                )}
              </div>

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
    </div>
  );
};

export default Collection;