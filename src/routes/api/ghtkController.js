const Setting = require('../../../config/setting')
const axios = require('axios')
const ClientService = require('../util/clientService')

function ghtkController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHTK : Setting.LOCAL.GHTK,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.ORDER_SERVICE, dataRequest.SENDER_DISTRICT,
        dataRequest.RECEIVER_DISTRICT, dataRequest.weight)
      let checkRequest = true
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
          return resolve({s: 500, data: error})
        })
      })
    },

    setPriceToCache: (req, res, dataRequest, data) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, data.fee.serviceId, dataRequest.SENDER_DISTRICT,
        dataRequest.RECEIVER_DISTRICT, dataRequest.weight)
      clientRedis.setex(keyCache, 300, JSON.stringify(data))
    }
  }
  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let dataRequest = JSON.parse(JSON.stringify(req.body.data))

      return Promise.all(
        services.map(service => {
          dataRequest.ORDER_SERVICE = service[0]
          dataRequest.transport = service[1]
          dataRequest.token = req.body.token

          return self.getPriceFromCache(req, res, dataRequest)
            .then(result => {
              if (result.s === 200) {
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
          // nếu thành công thì ghi vào log
          if (result.success) {
            self.setPriceToCache(req, res, dataRequest, result)
          }
        })

        return res.json({s: 200, data: results})
      }).catch(error => {
        return res.json({s: 500, data: error.message})
      })


      // try {
      //   await Promise.all(
      //     services.map(service => {
      //       let dataRequest = JSON.parse(JSON.stringify(req.body))
      //       dataRequest.transport = service[1]
      //
      //       return self.getPriceFromCache(req, res, dataRequest).then(dataCache => {
      //         if (dataCache.s == 200) {
      //           dataCache.data.serviceId = service
      //           result.push(dataCache.data)
      //         } else {
      //           return axios({
      //             method: 'get', url: self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url,
      //             params: dataRequest, headers: {'Token': dataRequest.token}
      //           }).then(response => {
      //             if (response.data.success) {
      //               response.data.fee.serviceId = service[0]
      //               self.setPriceToCache(req, res, dataRequest, response.data)
      //             } else {
      //               response.data.serviceId = service[0]
      //             }
      //
      //             result.push(response.data)
      //
      //           }).catch(error => {
      //             return res.json({s: 400, data: error})
      //           })
      //         }
      //       })
      //     })
      //   )
      //   return res.json({s: 200, data: result})
      // } catch (e) {
      //   return res.json({s: 400, data: e.message})
      // }
    }
  }
}

module.exports = new ghtkController()