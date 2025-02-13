// routes/rajaongkirRoutes.js
import express from 'express';
import rajaOngkirController from '../controllers/rajaOngkirController.js';

const router = express.Router();

router.get('/provinces', rajaOngkirController.getProvinces); // Route untuk get all provinces
router.get('/cities/:provinceId', rajaOngkirController.getCities); // Route untuk get cities by province ID
router.post('/cost', rajaOngkirController.getCost); //route untuk cost

export default router;