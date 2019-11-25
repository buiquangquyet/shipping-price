const Setting = require('../../../config/setting')
const axios = require('../client')
const ClientService = require('../util/clientService')

function ghnController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHN : Setting.LOCAL.GHN,

    getPriceFromDelivery: (req, res, dataDelivery) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery).then(response => {
          response.data.data.serviceId = dataDelivery.ServiceID
          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let data = {
              code: false,
              serviceId: dataDelivery.ServiceID,
              msg: 'Không thể kết nối đến máy chủ của GHN'
            }
            return resolve(data)
          } else {
            error.response.data.serviceId = dataDelivery.ServiceID
            return resolve(error.response.data)
          }

        })
      })
    },

    prepareDataToDelivery: (dataRequest, service, token) => {
      return {
        ServiceID: parseInt(service),
        FromDistrictID: parseInt(dataRequest.FromDistrictID),
        ToDistrictID: parseInt(dataRequest.ToDistrictID),
        Weight: parseInt(dataRequest.Weight),
        Length: parseInt(dataRequest.Length),
        Width: parseInt(dataRequest.Width),
        Height: parseInt(dataRequest.Height),
        CouponCode: dataRequest.CouponCode,
        InsuranceFee: dataRequest.InsuranceFee ? parseInt(dataRequest.InsuranceFee) : 0,
        token: token
      }
    }
  };

  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let dataRequest = JSON.parse(JSON.stringify(req.body.data))
      let checkRequest = true
      let isTrial = req.body.isTrial
      if (dataRequest.InsuranceFee || (dataRequest.OrderCosts && dataRequest.OrderCosts.length > 0)) {
        checkRequest = false
      }

      return Promise.all(
        services.map(service => {
          let dataDelivery = self.prepareDataToDelivery(dataRequest, service, req.body.token)
          let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataDelivery.ServiceID, dataDelivery.FromDistrictID,
            dataDelivery.ToDistrictID, dataDelivery.Weight, dataDelivery.Length, dataDelivery.Width, dataDelivery.Height, 0, dataDelivery.CouponCode)

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
          // nếu thành công thì ghi vào log - check thêm điều kiện có dvmr hay không và có hiện đang kết nối được vs redis hay không
          if (result.code && checkRequest && checkConnectRedis && !result.fromCache) {
            let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, result.data.serviceId, dataRequest.FromDistrictID,
              dataRequest.ToDistrictID, dataRequest.Weight, dataRequest.Length, dataRequest.Width, dataRequest.Height, 0, dataRequest.CouponCode)
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

module.exports = new ghnController()