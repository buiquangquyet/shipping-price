const Setting = require('../../../config/setting')
const axios = require('../client')
const crypto = require("crypto");
const ClientService = require('../util/clientService')

function splController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.SPL : Setting.LOCAL.SPL,
    API_KEY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.SPL.api_key : Setting.LOCAL.SPL.api_key,

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
          if (error.code && error.code === 'ECONNABORTED') {
            let data = {
              error_code: 504,
              serviceId: dataToDelivery.data.service,
              description: 'Không thể kết nối đến máy chủ của SpeedLink'
            }
            return resolve(data)
          } else {
            return resolve({s: 500, data: error})
          }
        })
      })
    },

  }
  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let dataRequestDelivery = JSON.parse(JSON.stringify(req.body.data.data))
      let checkRequest = !(dataRequestDelivery.coupon_code)

      return Promise.all(
        services.map(service => {
          let dataRequest = JSON.parse(JSON.stringify(req.body.data))
          dataRequest.data.service = service
          let dataDelivery = self.prepareDataToDelivery(dataRequest)
          let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataDelivery.data.service, dataDelivery.data.pickup_address_code,
            dataDelivery.data.receive_address_code, dataDelivery.data.weight, dataDelivery.data.length, dataDelivery.data.width, dataDelivery.data.height)

          return ClientService.checkCachePrice(keyCache, checkRequest)
            .then(result => {
              if (result.s === 200) {
                result.data.fromCache = true
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
          if (result.error_code === 1 && checkConnectRedis && checkRequest && !result.fromCache) {
            let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, result.data[0].serviceId, dataRequestDelivery.pickup_address_code,
              dataRequestDelivery.receive_address_code, dataRequestDelivery.weight, dataRequestDelivery.length, dataRequestDelivery.width, dataRequestDelivery.height)
            ClientService.setPriceToCache(keyCache, result)
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