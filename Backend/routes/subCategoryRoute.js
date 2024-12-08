import express  from "express";
import { 
    getSubCategories, 
    getSubCategoryById, 
  
    updateSubCategory, 
    deleteSubCategory, 
    addSubCategory

  } from '../controllers/subCategoryController.js';

const subCategoryRouter = express.Router();

subCategoryRouter.get('/', getSubCategories);
subCategoryRouter.get('/:id', getSubCategoryById);
subCategoryRouter.post('/add', addSubCategory);
subCategoryRouter.put('/update/:id', updateSubCategory);
subCategoryRouter.delete('/delete/:id', deleteSubCategory);

export default subCategoryRouter