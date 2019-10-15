const Setting = require('../../../config/setting');
const axios = require('axios');

function ghnController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHN : Setting.LOCAL.GHN,
    getPriceFromDelivery: (req, res) => {
      let dataRequest = req.dataRequest;

      return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataRequest).then(response => {
        return res.json({s: 200, data: response})
      }).catch(error => {
        let data = error.response
        return res.json({s: 200, data: data.data})
      })
    }
    
  };

  return {
    login: (req, res) => {

    },
    getPrice: (req, res) => {
        let dataRequest = req.body;
        let services = dataRequest.services

        dataRequest.token = self.INFO_DELIVERY.token;

        let functions = []
        for (let i = 0; i < services.length; i++) {
          dataRequest.ServiceID = services[i]
          req.dataRequest = dataRequest

        }
      return Promise.all([
        self.getPriceFromDelivery()
      ]).then(res => {

      })

        // return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataRequest).then(response => {
        //   return res.json({s: 200, data: response})
        // }).catch(error => {
        //   let data = error.response
        //   return res.json({s: 200, data: data.data})
        // })
    }
  }
}

module.exports = new ghnController()