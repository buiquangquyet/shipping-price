const Setting = require('../../../config/setting')
const axios = require('axios')
const ClientService = require('../util/clientService')

function vtpController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.VTP : Setting.LOCAL.VTP,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.ORDER_SERVICE, dataRequest.SENDER_DISTRICT + '_' + dataRequest.SENDER_PROVINCE,
        dataRequest.RECEIVER_DISTRICT + '_' + dataRequest.RECEIVER_PROVINCE, dataRequest.PRODUCT_WEIGHT)

      let checkRequest = !(dataRequest.ORDER_SERVICE_ADD)
      return new Promise((resolve, reject) => {
        if (!checkConnectRedis || !checkRequest) {
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
            s: 400, data: null
          })
        });
      })
    },

    setPriceToCache: (req, res, dataRequest, data) => {
      let checkRequest = !(dataRequest.ORDER_SERVICE_ADD)
      if (checkConnectRedis && checkRequest) {
        let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, data.data.serviceId, dataRequest.SENDER_DISTRICT + '_' + dataRequest.SENDER_PROVINCE,
          dataRequest.RECEIVER_DISTRICT + '_' + dataRequest.RECEIVER_PROVINCE, dataRequest.PRODUCT_WEIGHT)
        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
    },

    getPriceFromDelivery: (req, res, dataDelivery) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery, {headers: {'Token': dataDelivery.token}}
        ).then(response => {
          response.data.data.serviceId = dataDelivery.ORDER_SERVICE
          return resolve(response.data)
        }).catch(error => {
          let data = error.response.data
          data.serviceId = dataDelivery.ORDER_SERVICE
          return resolve(data)
        })
      })
    },
  }
  return {
    getPrice: async (req, res) => {
      let services = req.body.services

      return Promise.all(
        services.map(service => {
          let dataDelivery = JSON.parse(JSON.stringify(req.body.data))
          dataDelivery.ORDER_SERVICE = service
          dataDelivery.token = req.body.token

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
          if (!result.error) {
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

module.exports = new vtpController()