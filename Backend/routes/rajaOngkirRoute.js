import express  from "express";
import rajaOngkirController  from "../controllers/rajaOngkirController.js";


const rajaOngkirRouter = express.Router();

rajaOngkirRouter.get('/provinces', rajaOngkirController.getProvinces);
rajaOngkirRouter.get('/cities/:provinceId', rajaOngkirController.getCities);
rajaOngkirRouter.post('/cost', rajaOngkirController.getCost);


export default rajaOngkirRouter