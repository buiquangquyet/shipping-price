const Setting = require('../../../config/setting');
const axios = require('axios');

function ghnController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHN : Setting.LOCAL.GHN,
  };

  return {
    login: (req, res) => {

    },
    getPrice: async (req, res) => {
        let services = req.body.services
        req.body.token = self.INFO_DELIVERY.token;

        let result = []
        await Promise.all(
          services.map(service => {
            let dataRequest = JSON.parse(JSON.stringify(req.body))
            dataRequest.ServiceID = service
            return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataRequest).then(response => {
              let data = response.data
              data.serviceId = service
              result.push(response.data)
            }).catch(error => {
              let data = error.response.data
              data.serviceId = service
              result.push(data)
            })
          })
        )
        return res.json({s: 200, data: result})
    }
  }
}

module.exports = new ghnController()