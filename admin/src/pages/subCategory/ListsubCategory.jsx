import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { Plus, Search, Filter, Pencil, Trash } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const ListsubCategory = () => {
  const [subcategories, setSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [sortName, setSortName] = useState("");
  const [sortStatus, setSortStatus] = useState("");
  const navigate = useNavigate();

  const fetchSubCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURI}/api/subcategory/list`);
      if (response.data.success) {
        setSubCategories(response.data.subCategories);
      } else {
        toast.error(response.data.message || "Failed to fetch subcategories");
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("An error occurred while fetching subcategories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subcategory?")) {
      try {
        const response = await axios.delete(
          `${backendURI}/api/subcategory/delete/${id}`
        );
        if (response.data.success) {
          toast.success("Subcategory deleted successfully!");
          setSubCategories(
            subcategories.filter((subcategory) => subcategory._id !== id)
          );
        } else {
          toast.error(response.data.message || "Failed to delete subcategory");
        }
      } catch (error) {
        console.error("Error deleting subcategory:", error);
        toast.error("An error occurred while deleting the subcategory");
      }
    }
  };

  const filteredSubCategories = subcategories
    .filter((subcategory) =>
      subcategory.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Combined filtering and sorting
      if (sortName === "asc") {
        return a.name.localeCompare(b.name);
      } else if (sortName === "desc") {
        return b.name.localeCompare(a.name);
      }
      return 0; // No sorting
    })
    .filter((subcategory) => !sortStatus || subcategory.status === sortStatus);

  const handleEdit = (id) => {
    // Handle edit button click
    navigate(`/subcategory/edit/${id}`);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Subcategories</h1>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => (window.location.href = "/subcategory/add")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add SubCategory
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search subcategories..."
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
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <select
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                      value={sortName}
                      onChange={(e) => setSortName(e.target.value)}
                    >
                      <option value="">Urutkan Nama</option>
                      <option value="asc">A - Z</option>
                      <option value="desc">Z - A</option>
                    </select>
                    <select
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                      value={sortStatus}
                      onChange={(e) => setSortStatus(e.target.value)}
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
        ) : filteredSubCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No subcategories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubCategories.map((subcategory) => (
                  <tr key={subcategory._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subcategory.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subcategory.category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subcategory.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {subcategory.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-4">
                        <button className="text-blue-500 hover:text-blue-700 focus:outline-none">
                          <Pencil
                            className="w-4 h-4 mr-2"
                            onClick={() => handleEdit(subcategory._id)}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory._id)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ListsubCategory;
