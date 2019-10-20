const Setting = require('../../../config/setting')
const axios = require('axios')
const querystring = require('querystring');

function ghtkController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHTK : Setting.LOCAL.GHTK,
    TRANSPORTS : {
      'IN_PROVINCE': 'road',
      'IN_REGION' : 'road',
      'SPECIAL_FLY': 'fly',
      'SPECIAL_ROAD' : 'road',
    'OUT_REGION_FLY' : 'fly',
    'OUT_REGION_ROAD' : 'road', },


    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = 'GHTK_' + dataRequest.ORDER_SERVICE + '_' + dataRequest.SENDER_DISTRICT + '_' + dataRequest.RECEIVER_DISTRICT + '_' + dataRequest.PRODUCT_WEIGHT

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
      if (!checkRequest) {
        let keyCache = 'GHTK_' + dataRequest.ORDER_SERVICE + '_' + dataRequest.SENDER_DISTRICT + '_' + dataRequest.RECEIVER_DISTRICT + '_' + dataRequest.PRODUCT_WEIGHT
        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
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
            dataRequest.ORDER_SERVICE = service[0]
            dataRequest.transport = service[1]

            return self.getPriceFromCache(req, res, dataRequest).then(dataCache => {
              if (dataCache.s == 200) {
                dataCache.data.serviceId = service
                result.push(dataCache.data)
              } else {
                console.log(dataRequest.token)
                return axios.get(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url,
                  {
                    params: { pick_province: 'Hà Nội',
                      pick_district: 'Quận Hai Bà Trưng',
                      province: 'Hà nội',
                      district: 'Quận Cầu Giấy',
                      address: 'P.503 tòa nhà Auu Việt, số 1 Lê Đức Thọ',
                      weight: '1000',
                      value: '3000000',
                      transport: 'road',
                    }
                  }, {
                  headers : {
                    'Token': "056f2606eA584D4DC31b6ba50b6bffeDE1C1b2B1"
                  }
                }).then(response => {
                  console.log(1)
                  response.data.data.serviceId = service
                  result.push(response.data)
                  if (response.data.error) {
                    self.setPriceTocache(req, res, dataRequest, response.data)
                  }
                }).catch(error => {
                  console.log(error)
                  return res.json({s: 400, data: error.message})
                  // console.log(error.message)
                  // let data = error.response.data
                  // data.serviceId = service
                  // result.push(data)
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