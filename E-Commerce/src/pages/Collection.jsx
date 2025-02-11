import React, { useContext, useMemo, useReducer, useState, useCallback, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import Pagination from "../components/Pagination";
import { debounce } from "lodash";
import { Loader, Filter, XCircle } from "lucide-react"; // Import icons

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
                selectedSubcategories: [],
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
    const { products, categories, subCategories, search, showSearch, formatIDR, setSearch } = useContext(ShopContext);

    const [state, dispatch] = useReducer(reducer, initialState);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false); // Mobile filter visibility
    const itemsPerPage = 10;


    const debouncedSetSearch = useCallback(
        debounce((value) => {
            setSearch(value);
        }, 700),
        []
    );
    const debouncedSetCategory = useCallback(
        debounce((categoryId) => {
          dispatch({ type: "SET_CATEGORY", payload: categoryId });
        }, 300), // Adjust the delay as needed
        []
      );
    
      const debouncedToggleSubCategory = useCallback(
        debounce((subCategoryId) => {
          dispatch({ type: "TOGGLE_SUBCATEGORY", payload: subCategoryId });
        }, 300), // Adjust the delay as needed
        []
      );
    const relevantSubcategories = useMemo(() => {
        if (!state.selectedCategory) {
            return [];
        }
        return subCategories.filter((subCat) => subCat.category === state.selectedCategory);
    }, [subCategories, state.selectedCategory]);


    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (showSearch && search) {
            filtered = filtered.filter((item) =>
                item.name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (state.selectedCategory) {
            filtered = filtered.filter((item) => item.category === state.selectedCategory);
        }

        if (state.selectedSubcategories.length > 0) {
            filtered = filtered.filter((item) =>
                state.selectedSubcategories.includes(item.subCategory)
            );
        }

        if (state.sortType === "low-high") {
            filtered = filtered.sort((a, b) => a.price - b.price);
        } else if (state.sortType === "high-low") {
            filtered = filtered.sort((a, b) => b.price - a.price);
        }

        return filtered;
    }, [products, showSearch, search, state.selectedCategory, state.selectedSubcategories, state.sortType]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredProducts.slice(start, end);
    }, [filteredProducts, currentPage]);

    const setCategory = (categoryId) => {
        // dispatch({ type: "SET_CATEGORY", payload: categoryId });
        debouncedSetCategory(categoryId)
    };

    const toggleSubCategory = (subCategoryId) => {
        // dispatch({ type: "TOGGLE_SUBCATEGORY", payload: subCategoryId });
        debouncedToggleSubCategory(subCategoryId);
    };

    const resetFilters = () => {
        dispatch({ type: "RESET_FILTERS" });
    };
    const toggleMobileFilters = () => {
        setShowFilters(!showFilters);
    }

    useEffect(() => {
        setLoading(true);
        setError(null);
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [state.selectedCategory, state.selectedSubcategories, search, state.sortType]);

    return (
        <div className="container mx-auto px-4 py-8"> {/* Added container for better layout */}
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
                    className={`${showFilters ? 'block' : 'hidden'} md:block md:w-64 `}
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
                    <div className="flex justify-between items-center mb-4">

                        <div className="relative md:w-64">
                            {/* Search Input (Optional, if you want to keep search) */}
                            {showSearch && (
                            <input
                                type="text"
                                placeholder="Search products..."
                                defaultValue={search}
                                onBlur={(e) => debouncedSetSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                             )}
                        </div>
                        <select
                            onChange={(e) =>
                                dispatch({ type: "SET_SORT_TYPE", payload: e.target.value })
                            }
                            className="border border-gray-300 text-sm px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            aria-label="Sort products"
                        >
                            <option value="">Sort by: Relevant</option>
                            <option value="low-high">Sort by: Low to High</option>
                            <option value="high-low">Sort by: High to Low</option>
                        </select>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader className="animate-spin w-8 h-8 text-indigo-600" />
                            <p className="ml-2 text-gray-700">Loading products...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-red-600 py-8">
                            <p>Error: {error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((item) => (
                                        <ProductItem
                                            key={item._id}
                                            name={item.name}
                                            id={item._id}
                                            price={formatIDR(item.price)}
                                            image={item.image}
                                        />
                                    ))
                                ) : (
                                    <p className="text-center mt-4 text-lg col-span-full">
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