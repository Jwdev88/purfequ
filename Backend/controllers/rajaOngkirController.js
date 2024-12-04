import axios from 'axios';
const rajaOngkirController = {
  getProvinces: async (req, res) => {
    try {
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

      // Kirim data provinsi dan default city ID ke frontend
      res.json({ 
        provinces: provinces, 
        defaultProvinceId: bantenProvince ? bantenProvince.province_id : null, 
        defaultCityId: defaultCityId 
      });

    } catch (error) {
      console.error('Error fetching provinces:', error);
      res.status(500).json({ error: 'Failed to fetch provinces' });
    }
  },
  getCities: async (req, res) => {
    try {
      const provinceId = req.params.provinceId;
      const response = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
        headers: {
          key: process.env.API_RAJA_ONGKIR 
        }
      });
      res.json(response.data.rajaongkir.results);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  },

  getCost : async (req, res) => {
    try {
      const { origin, destination, weight, courier } = req.body;

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
      res.json(response.data.rajaongkir.results[0].costs);
    } catch (error) {
      console.error('Error fetching cost:', error);
      res.status(500).json({ error: 'Failed to fetch cost' });
    }
  }
};

export default rajaOngkirController;
