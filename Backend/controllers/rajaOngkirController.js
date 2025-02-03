import axios from 'axios';
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 3600 }); // Cache TTL 1 jam

const rajaOngkirController = {
  getProvinces: async (req, res) => {
    try {
      // Cek cache terlebih dahulu
      const cachedProvinces = cache.get('provinces');
      if (cachedProvinces) {
        console.log('Menggunakan data provinsi dari cache.');
        return res.json(cachedProvinces);
      }

      const response = await axios.get('https://api.rajaongkir.com/starter/province', {
        headers: {
          key: process.env.API_RAJA_ONGKIR 
        }
      });

      const provinces = response.data.rajaongkir.results;

      // Cari ID provinsi Banten
      const bantenProvince = provinces.find(province => province.province === 'Banten');

      // Jika provinsi Banten ditemukan, cari ID kota Tangerang
      let defaultCityId = null;
      if (bantenProvince) {
        const citiesResponse = await axios.get(`https://api.rajaongkir.com/starter/city?province=${bantenProvince.province_id}`, {
          headers: {
            key: process.env.API_RAJA_ONGKIR
          }
        });
        const cities = citiesResponse.data.rajaongkir.results;
        const tangerangCity = cities.find(city => city.city_name === 'Tangerang');
        if (tangerangCity) {
          defaultCityId = tangerangCity.city_id;
        }
      }

      const data = { 
        provinces: provinces, 
        defaultProvinceId: bantenProvince ? bantenProvince.province_id : null, 
        defaultCityId: defaultCityId 
      };

      // Simpan ke cache
      cache.set('provinces', data);

      // Kirim data provinsi dan default city ID ke frontend
      res.json(data);

    } catch (error) {
      console.error('Error fetching provinces:', error);
      res.status(500).json({ error: 'Failed to fetch provinces' });
    }
  },

  getCities: async (req, res) => {
    try {
      const provinceId = req.params.provinceId;

      // Cek cache terlebih dahulu
      const cachedCities = cache.get(`cities-${provinceId}`);
      if (cachedCities) {
        console.log('Menggunakan data kota dari cache.');
        return res.json(cachedCities);
      }

      const response = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
        headers: {
          key: process.env.API_RAJA_ONGKIR 
        }
      });

      const cities = response.data.rajaongkir.results;

      // Simpan ke cache
      cache.set(`cities-${provinceId}`, cities);

      res.json(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  },

  getCost : async (req, res) => {
    try {
      const { origin, destination, weight, courier } = req.body;

      const cacheKey = `cost-${origin}-${destination}-${weight}-${courier}`;
      const cachedCost = cache.get(cacheKey);
      if (cachedCost) {
        console.log('Menggunakan data biaya pengiriman dari cache.');
        return res.json(cachedCost);
      }
      console.error("weight:",weight);
      const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
        origin: origin,
        destination: destination,
        weight: weight,
        courier: courier
      }, {
        headers: {
          key: process.env.API_RAJA_ONGKIR 
        },
      });

      const costs = response.data.rajaongkir.results[0].costs;

      // Simpan ke cache
      cache.set(cacheKey, costs);

      res.json(costs);
    } catch (error) {
      console.error('Error fetching cost:', error);
      res.status(500).json({ error: 'Failed to fetch cost' });
    }
  }
};

export default rajaOngkirController;
