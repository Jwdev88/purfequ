// components/ui.js
import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Loader2Icon, Check, ChevronDown } from 'lucide-react'; // Perbaiki import di sini

export const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  error = "",
  placeholder = "",
  required = false,
  isDisabled = false,
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={`mt-1 block w-full px-3 py-2 border  rounded-md shadow-sm focus:outline-none  sm:text-sm ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
      placeholder={placeholder}
      required={required}
      isDisabled = {isDisabled}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export const TextareaField = ({
  label,
  name,
  value,
  onChange,
  error = "",
  placeholder = "",
  required = false,
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows="3"
      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none  sm:text-sm ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
      placeholder={placeholder}
      required={required}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export const Button = ({ children, type = "button", onClick, disabled, loading, className }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`
        inline-flex items-center justify-center
        py-2 px-4
        border border-transparent
        text-sm font-medium rounded-md
        text-white
        bg-indigo-600 hover:bg-indigo-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
  >
    {loading && <Loader2Icon className="animate-spin mr-2" size={16} />}
    {children}
  </button>
);

// components/ui.js
export const SelectField = ({ label, value, onChange, options, error, disabled }) => {
  const selectedOption = options.find((option) => option.value === value) || { label: `Select ${label}` };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <div className="relative mt-1">
              <Listbox.Button
                className={`relative w-full cursor-default rounded-md border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none sm:text-sm ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
              >
                <span className="block truncate">{selectedOption.label}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  static
                  className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                >
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `cursor-default select-none relative py-2 pl-8 pr-4 ${
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? 'font-semibold' : 'font-normal'
                            }`}
                          >
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                              <Check className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
