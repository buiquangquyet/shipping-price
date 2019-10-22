const Setting = require('../../../config/setting')
const axios = require('axios')

function ghtkController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHTK : Setting.LOCAL.GHTK,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = 'GHTK_' + dataRequest.ORDER_SERVICE + '_' + dataRequest.SENDER_DISTRICT + '_' + dataRequest.RECEIVER_DISTRICT + '_' + dataRequest.weight

      let checkRequest = true
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

    setPriceToCache: (req, res, dataRequest, data) => {
        let keyCache = 'GHTK_' + dataRequest.ORDER_SERVICE + '_' + dataRequest.SENDER_DISTRICT + '_' + dataRequest.RECEIVER_DISTRICT + '_' + dataRequest.weight
        clientRedis.setex(keyCache, 300, JSON.stringify(data))
    }
  }
  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let result = []

      try {
        await Promise.all(
          services.map(service => {
            let dataRequest = JSON.parse(JSON.stringify(req.body))
            dataRequest.transport = service[1]

            return self.getPriceFromCache(req, res, dataRequest).then(dataCache => {
              if (dataCache.s == 200) {
                dataCache.data.serviceId = service
                result.push(dataCache.data)
              } else {
                return axios ({method: 'get', url: self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url,
                  params: dataRequest, headers : {'Token': dataRequest.token}
                }).then(response => {
                  if (response.data.success) {
                    response.data.fee.serviceId = service[0]
                    self.setPriceToCache(req, res, dataRequest, response.data)
                  } else {
                    response.data.serviceId = service[0]
                  }

                  result.push(response.data)

                }).catch(error => {
                  return res.json({s: 400, data: error})
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

module.exports = new ghtkController()