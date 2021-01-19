const Setting = require('../../../config/setting')
const axios = require('../client')
const ClientService = require('../util/clientService')


function vtpController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.VTP : Setting.LOCAL.VTP,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.ORDER_SERVICE, dataRequest.SENDER_DISTRICT,
        dataRequest.RECEIVER_DISTRICT, dataRequest.PRODUCT_WEIGHT)

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
        let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, data.data.serviceId, dataRequest.SENDER_DISTRICT,
          dataRequest.RECEIVER_DISTRICT, dataRequest.PRODUCT_WEIGHT)
        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
    },

    getPriceFromDelivery: (req, res, dataDelivery) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery, {headers: {'Token': dataDelivery.token}}
        ).then(response => {
          if (response.data.error) {
            response.data.serviceId = dataDelivery.ORDER_SERVICE
          } else {
            response.data.data.serviceId = dataDelivery.ORDER_SERVICE
          }

          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let msgErr = 'Không thể kết nối đến máy chủ của hãng'
            if (error.message !== undefined && error.message.length > 0) {
              msgErr = error.message;
            }
            let data = {
              error: true,
              serviceId: dataDelivery.ORDER_SERVICE,
              msg: msgErr
            }
            return resolve(data)
          } else {
            let data = error.response.data
            data.serviceId = dataDelivery.ORDER_SERVICE
            return resolve(data)
          }
        })
      })
    },
  }
  return {
    getPrice: async (req, res) => {
      let isTrial = req.body.isTrial
      let services = req.body.services
      let dataServices = req.body.dataServices || [] //extra field when udpate check price with weight exchange
      let dataRequestDelivery = JSON.parse(JSON.stringify(req.body.data))

      let checkRequest = !(dataRequestDelivery.ORDER_SERVICE_ADD || dataRequestDelivery.MONEY_COLLECTION !== 0)


      return Promise.all(
        dataServices.map(dataService => {
          let service = dataService.service
          let dataDelivery = JSON.parse(JSON.stringify(dataService.data))
          dataDelivery.ORDER_SERVICE = service
          dataDelivery.token = req.body.token

          let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataDelivery.ORDER_SERVICE, dataDelivery.SENDER_DISTRICT,
            dataDelivery.RECEIVER_DISTRICT, dataDelivery.PRODUCT_WEIGHT)
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
          if (!result.error && checkRequest && checkConnectRedis && !result.fromCache) {
            let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, result.data.serviceId, dataRequestDelivery.SENDER_DISTRICT,
              dataRequestDelivery.RECEIVER_DISTRICT, dataRequestDelivery.PRODUCT_WEIGHT)
            ClientService.setPriceToCache(keyCache, result, isTrial)
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