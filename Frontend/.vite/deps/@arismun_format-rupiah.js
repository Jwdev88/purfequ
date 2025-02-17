import "./chunk-V4OQ3NZ2.js";

// node_modules/@arismun/format-rupiah/dist/format-rupiah.esm.js
var FormatRupiah = function FormatRupiah2(_ref) {
  var value = _ref.value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(value);
};
export {
  FormatRupiah
};
//# sourceMappingURL=@arismun_format-rupiah.js.map
