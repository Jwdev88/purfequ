import React, { useContext, useMemo, useReducer } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

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
          ? state.selectedSubCategory.filter(
              (subCat) => subCat !== action.payload
            )
          : [...state.selectedSubCategory, action.payload],
      };
    case "SET_SORT_TYPE":
      return { ...state, sortType: action.payload };
    default:
      return state;
  }
};

const Collection = () => {
  const { products, categories, subCategories, search, showSearch, formatIDR } =
    useContext(ShopContext);

  const [state, dispatch] = useReducer(reducer, initialState);

  // Filter and sort products using useMemo
  const filteredProducts = useMemo(() => {
    let filtered = products;

    console.log("FILTERED PRODUCTS", filtered);
    if (showSearch && search) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(search.toLowerCase())
      );
      console.log("FILTERED BY SEARCH", filtered);
    }

    if (state.selectedCategory.length > 0) {
      filtered = filtered.filter((item) =>
        state.selectedCategory.includes(item.category || "")
      );
      console.log("FILTERED BY CATEGORY", filtered);
    }

    if (state.selectedSubCategory.length > 0) {
      filtered = filtered.filter((item) =>
        state.selectedSubCategory.includes(item.subCategory || "")
      );
      console.log("FILTERED BY SUBCATEGORY", filtered);
    }

    if (state.sortType === "low-high") {
      return filtered.sort((a, b) => a.price - b.price);
    } else if (state.sortType === "high-low") {
      return filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [
    products,
    search,
    showSearch,
    state.selectedCategory,
    state.selectedSubCategory,
    state.sortType,
  ]);

  // Toggle category selection
  const toggleCategory = (value) => {
    dispatch({ type: "TOGGLE_CATEGORY", payload: value });
  };

  // Toggle subcategory selection
  const toggleSubCategory = (value) => {
    dispatch({ type: "TOGGLE_SUBCATEGORY", payload: value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Filter Section */}
      <div className="min-w-60">
        <p className="my-2 text-xl flex items-center cursor-pointer gap-2">
          FILTERS
          <img
            className="h-3 sm:hidden"
            src={assets.dropdown_icon}
            alt="Filter icon"
          />
        </p>

        {/* Categories */}
        <div className="border border-gray-300 pl-5 py-3 mt-6">
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <label key={cat._id} className="flex gap-2">
                  <input
                    type="checkbox"
                    value={cat.name}
                    onChange={(e) => toggleCategory(e.target.value)}
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
        <div className="border border-gray-300 pl-5 py-3 mt-6">
          <p className="mb-3 text-sm font-medium">SUBCATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {subCategories && subCategories.length > 0 ? (
              subCategories.map((subCat) => (
                <label key={subCat._id} className="flex gap-2">
                  <input
                    type="checkbox"
                    value={subCat.name}
                    onChange={(e) => toggleSubCategory(e.target.value)}
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
            className="border-2 border-gray-300 text-sm px-2"
          >
            <option value="">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* Product Items */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((item) => (
              <ProductItem
                key={item._id}
                name={item.name}
                id={item._id}
                price={formatIDR(item.price)}
                image={item.image}
              />
            ))
          ) : (
            <p>Tidak ada produk yang ditemukan berdasarkan filter Anda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
