import React from "react";
import { Field, ErrorMessage } from "formik";

export const useFormFields = () => {
  
  
  // 
  const renderField = (label, name, type = "text", options = [], placeholder = "") => (
    <div className="w-full mb-4">
      <label htmlFor={name} className="block text-gray-700 font-semibold mb-2">
        {label} {/* Label yang dinamis sesuai parameter */}
      </label>
      <Field
        as={type === "select" ? "select" : type === "textarea" ? "textarea" : "input"}
        name={name}
        id={name}
        className="w-full border rounded-md p-2"
        placeholder={placeholder}
      >
        {type === "select" &&
          options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
      </Field>
      <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
    </div>
  );
  

  const renderStatusField = (label, name, options = []) => (
    <div className="w-full mb-4">
      <label  htmlFor={name} className="block mb-2 font-semibold text-gray-700">
        {label}
      </label>
      <Field
        name={name}
        type="text"
        as="select"
        placeholder={label}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      > 
        <option value="" disabled>
          Pilih {label}
        </option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </Field>
      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );

  const renderImageField = (label, name, setFieldValue, initialImage = null) => {
    const [imagePreview, setImagePreview] = React.useState(initialImage);

    const handleImageChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setFieldValue(name, file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFieldValue(name, null);
        setImagePreview(initialImage);
      }
    };

    return (
      <div className="w-full mb-4">
        <label className="block mb-2 font-semibold text-gray-700">{label}</label>

        {/* Preview gambar */}
        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg rounded border border-gray-300 shadow-sm"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        />
        <ErrorMessage
          name={name}
          component="div"
          className="text-red-500 text-sm mt-1"
        />
      </div>
    );
  };

  return {
    renderField,
    renderStatusField,
    renderImageField,
  };
};
