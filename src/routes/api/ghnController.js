const Setting = require('../../../config/setting')
const axios = require('axios')

function ghnController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHN : Setting.LOCAL.GHN,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = 'GHN_' + dataRequest.ServiceID + '_' + dataRequest.FromDistrictID + '_' + dataRequest.ToDistrictID + '_'
        + dataRequest.Weight  +  '_' + dataRequest.Length + '_' + dataRequest.Width + '_' + dataRequest.Height

      let checkRequest = dataRequest.CouponCode || dataRequest.InsuranceFee ? false : true
      return new Promise((resolve, reject) => {
        if (!checkRequest) {
          return resolve({
            s: 400, data: null
          })
        } else {
          return clientRedis.get(keyCache, (err, data) => {
            if (data) {
              return resolve({
                s: 200, data: JSON.parse(data)
              })
            } else {
              return resolve({
                s: 400, data: null
              })
            }

          });

        }
      })
    },

    setPriceTocache: (req, res, dataRequest, data) => {
      let checkRequest = dataRequest.CouponCode || dataRequest.InsuranceFee ? false : true
      if (checkRequest) {
        let keyCache = 'GHN_' + dataRequest.ServiceID + '_' + dataRequest.FromDistrictID + '_' + dataRequest.ToDistrictID + '_'
          + dataRequest.Weight  +  '_' + dataRequest.Length + '_' + dataRequest.Width + '_' + dataRequest.Height

        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
    },

    prepareDataToDelivery: (dataRequest, service) => {
      return {
        ServiceID: parseInt(service),
        FromDistrictID: parseInt(dataRequest.FromDistrictID),
        ToDistrictID: parseInt(dataRequest.ToDistrictID),
        Weight: parseInt(dataRequest.Weight),
        Length: parseInt(dataRequest.Length),
        Width: parseInt(dataRequest.Width),
        Height: parseInt(dataRequest.Height),
        CouponCode: dataRequest.CouponCode,
        InsuranceFee: dataRequest.InsuranceFee ? parseInt(dataRequest.InsuranceFee) : 0,
        token: dataRequest.token
      }
    }
  };

  return {
    getPrice: async (req, res) => {
        let services = req.body.services
        let result = []
        try {
          await Promise.all(
            services.map(service => {
              let dataRequest = JSON.parse(JSON.stringify(req.body))
              let dataDelivery = self.prepareDataToDelivery(dataRequest, service)

              return self.getPriceFromCache(req, res, dataDelivery).then(dataCache => {
                if (dataCache.s == 200) {
                  dataCache.data.serviceId = service
                  result.push(dataCache.data)
                } else {
                  return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery).then(response => {
                    response.data.data.serviceId = service
                    result.push(response.data)
                    self.setPriceTocache(req, res, dataRequest, response.data)
                  }).catch(error => {
                    let data = error.response.data
                    data.serviceId = service
                    result.push(data)
                  })
                }
              })
            })
          )
          return res.json({s: 200, data: result})
        } catch (e) {
          return res.json({s: 400, data: e.message})
        }
    }
  }
}

module.exports = new ghnController()