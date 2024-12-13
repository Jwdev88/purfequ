import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { Plus, Search, Filter } from "lucide-react";
import { ProductCard } from "./Productcard";

const ProductList = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [sortPrice, setSortPrice] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);


  // Filter products based on criteria
    // Fetch products from the backend
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(backendURI + "/api/product/list", {
          headers: { token },
        });
  
        if (response.data.success) {
          setProducts(response.data.products);
        } else {
          toast.error("Failed to fetch products");
        }
      } catch (error) {
        toast.error("Error fetching products:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    // Fetch products when token changes
    useEffect(() => {
      fetchProducts();
    }, [token]);
  
    // Fetch categories when token changes
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(backendURI + "/api/category/list", {
            headers: { token },
          });
          setCategories(response.data.categories);
        } catch (error) {
          toast.error("Gagal mengambil data Category:", error.message);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchCategories();
    }, [token]);
  
    // Fetch subcategories when token changes
    useEffect(() => {
      const fetchSubCategories = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(backendURI + "/api/subcategory/list", {
            headers: { token },
          });
          setSubCategories(response.data.subCategories);
        } catch (error) {
          toast.error("Gagal mengambil data Subcategory:", error.message);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchSubCategories();
    }, [token]);
  
    // Filter products based on criteria
    const filteredProducts = products.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!filterCategory || product.category?._id === filterCategory) &&
        (!filterSubCategory ||
          (product.subCategory && product.subCategory._id === filterSubCategory))
      );
    });
  
    // Sort products by price
    const sortedProducts = [...filteredProducts]; // Create a copy of the filtered array
    if (sortPrice === "high") {
      sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortPrice === "low") {
      sortedProducts.sort((a, b) => a.price - b.price);
    }
  
    // Handle product deletion
    const handleDelete = async (id) => {
      if (window.confirm("Are you sure you want to delete this product?")) {
        try {
          await axios.post(
            backendURI + "/api/product/delete",
            { id },
            { headers: { token } }
          );
  
          // Update the products state immediately
          setProducts((prevProducts) =>
            prevProducts.filter((product) => product._id !== id)
          );
  
          toast.success("Product deleted successfully");
        } catch (error) {
          toast.error("Error deleting product:", error.message);
        }
      }
    };
  


  // Redirect to edit page
  const handleEdit = (product_id) => {
    window.location.href = `/product/edit/${product_id}`;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => (window.location.href = "/product/add")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </div>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowFilter(!showFilter)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              {showFilter && (
                <div className="origin-top-right absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <select
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="">Semua Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                      value={filterSubCategory}
                      onChange={(e) => setFilterSubCategory(e.target.value)}
                      // Disabled if no category is selected
                      disabled={!filterCategory}
                    >
                      <option value="">Semua Subcategory</option>
                      {subCategories
                        .filter((subCategory) =>
                          filterCategory
                            ? subCategory.category._id === filterCategory
                            : true
                        )
                        .map((subCategory) => (
                          <option key={subCategory._id} value={subCategory._id}>
                            {subCategory.name.toUpperCase()}
                          </option>
                        ))}
                    </select>
                    <select
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      value={sortPrice}
                      onChange={(e) => setSortPrice(e.target.value)}
                    >
                      <option value="">Urutkan Harga</option>
                      <option value="high">Harga Tertinggi</option>
                      <option value="low">Harga Terendah</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductList;
