const Setting = require('../../../config/setting')
const axios = require('../client')
const ClientService = require('../util/clientService')

function ghtkController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHTK : Setting.LOCAL.GHTK,
    FROM_CACHE: false,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.ORDER_SERVICE, dataRequest.SENDER_DISTRICT,
        dataRequest.RECEIVER_DISTRICT, dataRequest.weight)
      let checkRequest = !(dataRequest.value)
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
            s: 500, data: null
          })
        });
      })
    },

    getPriceFromDelivery: (req, res, dataRequest, serviceId) => {
      return new Promise((resolve, reject) => {
        return axios({
          method: 'get', url: self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url,
          params: dataRequest, headers: {'Token': dataRequest.token}
        }).then(response => {
          if (response.data.success) {
            response.data.fee.serviceId = serviceId
            return resolve(response.data)
          }
            response.data.serviceId = serviceId
            return resolve(response.data)

        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let data = {
              success: false,
              serviceId: serviceId,
              msg: 'Không thể kết nối đến máy chủ của GHTK'
            }
            return resolve(data)
          } else {
            return resolve({s: 500, data: error})
          }
        })
      })
    },

    setPriceToCache: (req, res, dataRequest, data) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, data.fee.serviceId, dataRequest.SENDER_DISTRICT,
        dataRequest.RECEIVER_DISTRICT, dataRequest.weight)

      let checkRequest = !(dataRequest.value && dataRequest.value != 0)
      if (checkConnectRedis && checkRequest) {
        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
    }
  }
  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let dataRequest = JSON.parse(JSON.stringify(req.body.data))
      let checkRequest = !(dataRequest.value && dataRequest.value != 0)

      return Promise.all(
        services.map(service => {
          dataRequest.ORDER_SERVICE = service[0]
          dataRequest.transport = service[1]
          dataRequest.token = req.body.token
          let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.ORDER_SERVICE, dataRequest.SENDER_DISTRICT,
            dataRequest.RECEIVER_DISTRICT, dataRequest.weight)

          return ClientService.checkCachePrice(keyCache, checkRequest)
            .then(result => {
              if (result.s === 200) {
                result.data.fromCache = true
                return result.data
              }
              return null
            }).then(resultCache => {
              if (!resultCache) { // nếu k có cache thì sẽ gọi lên hãng
                return self.getPriceFromDelivery(req, res, dataRequest, service[0])
              }

              return resultCache
            })
        })
      ).then(results => {
        results.map(result => {
          // nếu thành công thì ghi vào log - check thêm điều kiện có dvmr hay không và có hiện đang kết nối được vs redis hay không
          if (result.success && checkRequest && checkConnectRedis && !result.fromCache) {
            let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, result.fee.serviceId, dataRequest.SENDER_DISTRICT,
              dataRequest.RECEIVER_DISTRICT, dataRequest.weight)
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

module.exports = new ghtkController()