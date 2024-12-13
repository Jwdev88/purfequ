import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';


export const ProductCard = ({ product, onEdit, onDelete }) => {
    const [showVariants, setShowVariants] = useState(false);
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400">No image</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{product.description.substring(0, 100)}...</p>
                            </div>
                            <div className="group">
                                <button className="p-1 hover:bg-gray-100 rounded-full">
                                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                                </button>
                                <div className="absolute right-0 w-40 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => onEdit(product._id)}
                                            className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Product
                                        </button>
                                        <button
                                            onClick={() => onDelete(product._id)}
                                            className="flex items-center px-2 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Product
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p> {product.category.name}</p><p> {product.subCategory.name}</p>
                       
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">SKU</p>
                                <p className="text-sm font-medium">{product.sku}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Stock</p>
                                <p className="text-sm font-medium">{product.stock}</p>
                            </div>
                        </div>

                        {product.variants && product.variants.length > 0 ? (
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-700">Variasi Produk:</p>
                                    <button className="text-blue-500 hover:underline" onClick={() => setShowVariants(!showVariants)}>
                                        {showVariants ? 'Sembunyikan Detail' : 'Lihat Detail'}
                                    </button>
                                </div>
                                {showVariants && ( // Tampilkan detail varian jika showVariants true
                                    <div className="border rounded-md p-2">
                                        {product.variants.map((variant) => (
                                            <div key={variant._id} className="border-b py-2">
                                                {variant.options.map((option) => (
                                                    <div key={option._id} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{option.name}</p>
                                                            <p className="text-xs text-gray-500">SKU: {option.sku}</p>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <p className="text-sm font-medium text-gray-900 mr-4">Rp {option.price}</p>
                                                            <p className="text-sm text-gray-500 mr-4">Stok: {option.stock}</p>
                                                            <label className="switch">
                                                                <input type="checkbox" checked={option.active} />
                                                                <span className="slider round"></span>
                                                            </label>
                                                            <button className="text-gray-500 hover:text-gray-700 ml-4">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ... (bagian Price jika tidak ada varian sama seperti sebelumnya) ...
                            <div className="mt-4">
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="text-lg font-medium text-blue-600">Rp.{product.price}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}