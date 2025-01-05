import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const ProductItem = ({ id }) => {
  const { formatIDR, products } = useContext(ShopContext);

  // Menggunakan useMemo untuk mendapatkan produk berdasarkan id
  const product = useMemo(() => {
    return products.find((item) => item._id === id) || null;
  }, [products, id]);

  // Fungsi untuk mendapatkan rentang harga varian
  const getVariantPrices = useMemo(() => {
    if (!product?.variants?.length) return [];

    return product.variants.flatMap((variant) =>
      variant.options.map((option) => option.price)
    );
  }, [product]);

  if (!product) return null; // Early return jika produk tidak ditemukan

  return (
    <Link
      to={`/product/${id}`}
      className="block hover:shadow-lg rounded-md overflow-hidden transition-shadow"
      title={product.name}
    >
      {/* Gambar Produk */}
      <div className="relative">
        <img
          src={product.images?.[0] || ""}
          alt={product.name}
          className="w-full h-60 object-cover"
        />
        <div className="absolute bottom-0 left-0 bg-white p-2 rounded-bl-md">
          <p className="text-gray-800 font-semibold">
            {getVariantPrices.length > 0 ? (
              <>
                {formatIDR(Math.min(...getVariantPrices))} -{" "}
                {formatIDR(Math.max(...getVariantPrices))}
              </>
            ) : (
              formatIDR(product.price || 0)
            )}
          </p>
        </div>
      </div>

      {/* Informasi Produk */}
      <div className="p-2">
        <h2 className="font-semibold text-sm truncate">{product.name}</h2>
        <div className="mt-1 flex items-center">
          {/* Rating Produk */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Sparkles
              key={i}
              className={`w-5 h-5 ${
                i < Math.floor(product.rating)
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ProductItem;
