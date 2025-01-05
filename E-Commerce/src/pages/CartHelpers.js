// cartHelpers.js
export const formatCartItemData = (item) => ({
    productId: item.productId,
    productName: item.productName || "Unknown Product",
    productImage: item.productImages?.[0] || "/default-image.png",
    productPrice: item.productPrice || 0,
    productCategory: item.productCategory || "No Category",
    productSubCategory: item.productSubCategory || "No Subcategory",
    variantId: item.variant?.variantId || null,
    variantName: item.variant?.variantName || "No Variant",
    optionId: item.variant?.selectedOption?.optionId || null,
    optionName: item.variant?.selectedOption?.optionName || "No Option",
    optionPrice: item.variant?.selectedOption?.optionPrice || item.productPrice || 0,
    quantity: item.quantity || 1,
    totalPrice: (item.variant?.selectedOption?.optionPrice || item.productPrice || 0) * (item.quantity || 1),
  });
  