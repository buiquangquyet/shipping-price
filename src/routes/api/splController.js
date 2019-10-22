const Setting = require('../../../config/setting')
const axios = require('axios')
const crypto = require("crypto");
const ClientService = require('../util/clientService')

function splController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.SPL : Setting.LOCAL.SPL,
    API_KEY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.SPL.api_key : Setting.LOCAL.SPL.api_key,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.data.service, dataRequest.data.pickup_address_code,
        dataRequest.data.receive_address_code, dataRequest.data.weight, dataRequest.data.length, dataRequest.data.width, dataRequest.data.height)

      let checkRequest = !(dataRequest.coupon_code)
      return new Promise((resolve, reject) => {
        if (!checkRequest) {
          return resolve({
            s: 500, data: null
          })
        }
        return clientRedis.get(keyCache, (err, data) => {
          if (data) {
            return resolve({
              s: 200, data: JSON.parse(data)
            })
          }
          return resolve({
            s: 500, data: null
          })

        });
      })
    },

    setPriceToCache: (req, res, dataRequest, data) => {
      let checkRequest = !(dataRequest.data.coupon_code)

      if (checkRequest) {
        let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, data.data[0].serviceId, dataRequest.data.pickup_address_code,
          dataRequest.data.receive_address_code, dataRequest.data.weight, dataRequest.data.length, dataRequest.data.width, dataRequest.data.height)

        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
    },

    getAuthorization: (dataRequest) => {
      let string = JSON.stringify(dataRequest) + self.API_KEY
      var hmac = crypto.createHmac('sha1', string)
      let signed = hmac.update('SPEEDLINK').digest("hex");
      return signed
    },

    prepareDataToDelivery: (dataRequest) => {
      return {
        api_key: dataRequest.api_key,
        timestamp: Math.floor(Date.now() / 1000),
        data: dataRequest.data,
      }
    },

    getPriceFromDelivery: (req, res, dataToDelivery) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url,
          dataToDelivery,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": self.getAuthorization(dataToDelivery)
            }
          }
        ).then(response => {
          if (response.data.error_code === 1) {
            response.data.data[0].serviceId = dataToDelivery.data.service
            return resolve(response.data)
          }
            response.data.serviceId = dataToDelivery.data.service
            return resolve(response.data)
        }).catch(error => {
          return resolve({s: 500, data: error})
        })
      })
    },

  }
  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let result = []


      return Promise.all(
        services.map(service => {
          let dataRequest = JSON.parse(JSON.stringify(req.body))
          dataRequest.data.service = service
          let dataDelivery = self.prepareDataToDelivery(dataRequest)
          return self.getPriceFromCache(req, res, dataDelivery)
            .then(result => {
              if (result.s === 200) {
                return result.data
              }
              return null
            }).then(resultCache => {
              if (!resultCache) { // nếu k có cache thì sẽ gọi lên hãng
                return self.getPriceFromDelivery(req, res, dataDelivery)
              }

              return resultCache
            })
        })
      ).then(results => {
        results.map(result => {
          // nếu thành công thì ghi vào log
          if (result.error_code === 1) {
            self.setPriceToCache(req, res, req.body, result)
          }
        })

        return res.json({s: 200, data: results})
      }).catch(error => {
        return res.json({s: 500, data: error.message})
      })
    }
  }
}

module.exports = new splController()