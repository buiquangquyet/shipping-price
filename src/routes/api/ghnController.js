const Setting = require('../../../config/setting')
const axios = require('axios')
const ClientService = require('../util/clientService')

function ghnController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.GHN : Setting.LOCAL.GHN,

    getPriceFromCache: (req, res, dataRequest) => {
      let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, dataRequest.ServiceID, dataRequest.FromDistrictID,
        dataRequest.ToDistrictID, dataRequest.Weight, dataRequest.Length, dataRequest.Width, dataRequest.Height)

      // nếu có dịch vụ mở rộng thì k lưu cache vì giá khác nhau
      let checkRequest = !(dataRequest.CouponCode || dataRequest.InsuranceFee)
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

    getPriceFromDelivery: (req, res, dataDelivery) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery).then(response => {
          response.data.data.serviceId = dataDelivery.ServiceID
          return resolve(response.data)
        }).catch(error => {
          error.response.data.serviceId = dataDelivery.ServiceID
          return resolve(error.response.data)
        })
      })
    },

    setPriceToCache: (req, res, dataRequest, data) => {
      let checkRequest = !(dataRequest.CouponCode || dataRequest.InsuranceFee)
      if (checkRequest) {
        let keyCache = ClientService.genKeyCache(self.INFO_DELIVERY.client_code, data.data.serviceId, dataRequest.FromDistrictID,
          dataRequest.ToDistrictID, dataRequest.Weight, dataRequest.Length, dataRequest.Width, dataRequest.Height)

        clientRedis.setex(keyCache, 300, JSON.stringify(data))
      }
    },

    prepareDataToDelivery: (dataRequest, service) => {
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
        token: dataRequest.token
      }
    }
  };

  return {
    getPrice: async (req, res) => {
      let services = req.body.services
      let dataRequest = JSON.parse(JSON.stringify(req.body))

      return Promise.all(
        services.map(service => {
          let dataDelivery = self.prepareDataToDelivery(dataRequest, service)

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
          if (result.code) {
            self.setPriceToCache(req, res, dataRequest, result)
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