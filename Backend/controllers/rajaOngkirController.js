// controllers/rajaongkirController.js
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache 1 jam (3600 detik)

const rajaOngkirController = {
    getProvinces: async (req, res) => {
        try {
            const cachedProvinces = cache.get('provinces');
            if (cachedProvinces) {
                ////console.log('Using cached provinces data.');
                return res.json({ success: true, provinces: cachedProvinces });
            }

            const response = await axios.get('https://api.rajaongkir.com/starter/province', {
                headers: {
                    key: process.env.API_RAJA_ONGKIR // Pastikan variabel ini ada di .env
                }
            });

            const provinces = response.data.rajaongkir.results;
            cache.set('provinces', provinces);
            res.json({ success: true, provinces: provinces }); // Kirim dalam format yang konsisten

        } catch (error) {
            console.error('Error fetching provinces:', error);
             let errorMessage = 'Failed to fetch provinces.';
            if (error.response && error.response.data && error.response.data.rajaongkir && error.response.data.rajaongkir.status) {
                errorMessage = error.response.data.rajaongkir.status.description; // Ambil pesan dari RajaOngkir jika ada
            }
            res.status(500).json({ success: false, message: errorMessage, error: error.message });
        }
    },

    getCities: async (req, res) => {
        try {
            const { provinceId } = req.params; // Ambil provinceId dari parameter URL

            if (!provinceId) {
                return res.status(400).json({ success: false, message: 'provinceId is required' }); // Validasi
            }

            const cachedCities = cache.get(`cities-${provinceId}`);
            if (cachedCities) {
                ////console.log('Using cached cities data.');
                return res.json({ success: true, cities: cachedCities });
            }

            const response = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
                headers: {
                    key: process.env.API_RAJA_ONGKIR
                }
            });
            const cities = response.data.rajaongkir.results;
            cache.set(`cities-${provinceId}`, cities);
            res.json({ success: true, cities: cities });

        } catch (error) {
            console.error('Error fetching cities:', error);
            let errorMessage = 'Failed to fetch cities.';
            if(error.response && error.response.data && error.response.data.rajaongkir && error.response.data.rajaongkir.status){
                errorMessage = error.response.data.rajaongkir.status.description
            }
            res.status(500).json({ success: false, message: errorMessage, error: error.message });
        }
    },
    getCost: async (req, res) => {
        try {
            const { origin, destination, weight, courier } = req.body;

            // Validasi input (sangat penting!)
            if (!origin || !destination || !weight || !courier) {
                return res.status(400).json({ success: false, message: 'Missing required parameters (origin, destination, weight, courier)' });
            }
            if (typeof weight !== 'number' || weight <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid weight.  Must be a positive number.' });
            }


            const cacheKey = `cost-${origin}-${destination}-${weight}-${courier}`;
            const cachedCost = cache.get(cacheKey);

            if (cachedCost) {
                ////console.log('Menggunakan data biaya pengiriman dari cache.');
                return res.json({ success: true, costs: cachedCost }); //Format yang konsisten
            }
            // ////console.log("Data Dari req.body",req.body)
            const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
                origin,
                destination,
                weight,
                courier
            }, {
                headers: {
                    key: process.env.API_RAJA_ONGKIR
                }
            });
            // ////console.log("Cek Response:",response.data)
            const costs = response.data.rajaongkir.results[0]?.costs; //optional chaining

            if (!costs) {
                return res.status(404).json({success: false, message: "No shipping costs found for the given parameters."})
            }

            // Simpan ke cache
            cache.set(cacheKey, costs);

            res.json({ success: true, costs }); // Format yang konsisten

        } catch (error) {
            console.error('Error fetching cost:', error);
            let errorMessage = 'Failed to fetch cost';
            if (error.response && error.response.data && error.response.data.rajaongkir && error.response.data.rajaongkir.status) {
                errorMessage = error.response.data.rajaongkir.status.description; // Pesan error dari RajaOngkir
                console.error("RajaOngkir Error Details:", error.response.data.rajaongkir.status); // Log detail error
            }
            res.status(500).json({ success: false, message: errorMessage, error: error.message }); // Kirim pesan error yang lebih informatif

        }
    }

};

export default rajaOngkirController;