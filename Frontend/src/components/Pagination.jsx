import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import React from "react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      {/* Mobile Pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Desktop Pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </p>
        <nav
          aria-label="Pagination"
          className="isolate inline-flex -space-x-px rounded-md shadow-sm"
        >
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            disabled={currentPage === 1}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
          </button>
          {getPages().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                currentPage === page
                  ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;
