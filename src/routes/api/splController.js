const Setting = require('../../../config/setting')
const axios = require('axios')
const crypto = require("crypto");

function splController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.SPL : Setting.LOCAL.SPL,
    API_KEY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.SPL.api_key : Setting.LOCAL.SPL.api_key,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = 'SPL_' + dataRequest.service + '_' + dataRequest.width + '_' + dataRequest.length + '_' + dataRequest.height + '_' + dataRequest.weight

      let checkRequest = dataRequest.coupon_code ? false : true
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
      let checkRequest = dataRequest.coupon_code ? false : true

        if (checkRequest) {
          let keyCache = 'SPL_' + dataRequest.service + '_' + dataRequest.width + '_' + dataRequest.length + '_' + dataRequest.height + '_' + dataRequest.weight

          clientRedis.setex(keyCache, 300, JSON.stringify(data))
        }
    },

    getAuthorization: (dataRequest) => {
      let string = JSON.stringify(dataRequest) + self.API_KEY
      var hmac = crypto.createHmac('sha1', string)
      let signed = hmac.update('SPEEDLINK').digest("hex");
      return signed
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
            dataRequest.data.service = service

            let dataToDelivery = {
              api_key: dataRequest.api_key,
              timestamp: Math.floor(Date.now() / 1000),
              data: dataRequest.data,
            }

            return self.getPriceFromCache(req, res, dataToDelivery.data).then(dataCache => {
              if (dataCache.s == 200) {
                dataCache.data.serviceId = service
                result.push(dataCache.data)
              } else {
                console.log(dataToDelivery)
                return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url,
                  dataToDelivery,
                  {
                    headers : {
                      "Content-Type" : "application/json",
                      "Authorization" : self.getAuthorization(dataToDelivery)
                    }
                  }
                ).then(response => {
                  console.log(response.config)
                  if (response.data.error_code == 1) {
                    response.data.data.serviceId = service
                    self.setPriceToCache(req, res, dataRequest, response.data)
                  } else {
                    response.data.serviceId = service
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

module.exports = new splController()