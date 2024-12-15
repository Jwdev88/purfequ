import React from "react";
import { Form } from "formik";
import { ImageUpload } from "./form/ImageUpload";
import { BasicInfo } from "./form/BasicInfo";
import { CategorySelection } from "./form/CategorySelection";
import { VariantSection } from "./form/VariantSection";
import { BestsellerCheckbox } from "./form/BestsellerCheckbox";
import { SubmitButton } from "./form/SubmitButton";

export const ProductForm = ({ values, setFieldValue, categories, subCategories }) => {
  return (
    <Form className="flex flex-col w-full items-start gap-6">
      <ImageUpload values={values} setFieldValue={setFieldValue} />
      <BasicInfo />
      <CategorySelection 
        categories={categories} 
        subCategories={subCategories} 
        setFieldValue={setFieldValue}
      />
      {values.variants.length === 0 && (
        <BasicProductDetails values={values} />
      )}
      <VariantSection values={values} setFieldValue={setFieldValue} />
      <BestsellerCheckbox />
      <SubmitButton />
    </Form>
  );
};