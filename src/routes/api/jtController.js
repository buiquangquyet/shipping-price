const Setting = require('../../../config/setting')
const axios = require('../client')
const ClientService = require('../util/clientService')
const md5 = require('md5');
const formUrlEncoded = x =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

function jtController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.JT : Setting.LOCAL.JT,
    FROM_CACHE: false,

    getPriceFromDelivery: (req, res, dataRequest, serviceId) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, formUrlEncoded(dataRequest), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).then(response => {
          console.log(response.data)
          response.data.responseitems[0].serviceId = serviceId
          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let data = {
              success: false,
              serviceId: serviceId,
              msg: 'Không thể kết nối đến máy chủ của J&T'
            }
            return resolve(data)
          } else {
            return resolve({s: 500, data: error})
          }
        })
      })
    },

    getDataDigest: (logisticInterface, apiKey) => {
      let string = logisticInterface + apiKey
      var hash = md5(string)
      let buff = new Buffer(hash)
      return buff.toString('base64')
    },

    prepareDataToDelivery: (dataRequest, service) => {
      let logisticsInterface = JSON.parse(dataRequest.data.logistics_interface)
      logisticsInterface.producttype = service

      return {
        msg_type: dataRequest.data.msg_type,
        eccompanyid: dataRequest.data.eccompanyid,
        logistics_interface: JSON.stringify(logisticsInterface),
        data_digest: self.getDataDigest(JSON.stringify(logisticsInterface), dataRequest.api_key)
      }
    }
  }
  return {
    getPrice: async (req, res) => {
      let isTrial = req.body.isTrial
      let services = req.body.services
      let dataRequestDelivery = JSON.parse(JSON.stringify(req.body.data))
      let checkRequest = true

      return Promise.all(
        services.map(service => {
          let dataDelivery = self.prepareDataToDelivery(dataRequestDelivery, service)
          let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, service, dataRequestDelivery.SENDER_DISTRICT,
            dataRequestDelivery.RECEIVER_WARD_ID, dataRequestDelivery.weight)

          return ClientService.checkCachePrice(keyCache, checkRequest)
            .then(result => {
              if (result.s === 200) {
                result.data.fromCache = true
                return result.data
              }
              return null
            }).then(resultCache => {
              if (!resultCache) { // nếu k có cache thì sẽ gọi lên hãng
                return self.getPriceFromDelivery(req, res, dataDelivery, service)
              }

              return resultCache
            })
        })
      ).then(results => {
        results.map(result => {
          // nếu thành công thì ghi vào log - check thêm điều kiện có dvmr hay không và có hiện đang kết nối được vs redis hay không
          if (result.responseitems && result.responseitems[0].success && checkRequest && checkConnectRedis && !result.fromCache) {
            let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, result.responseitems[0].serviceId, dataRequestDelivery.SENDER_DISTRICT,
              dataRequestDelivery.RECEIVER_WARD_ID, dataRequestDelivery.weight)
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

module.exports = new jtController()