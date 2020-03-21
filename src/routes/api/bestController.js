const Setting = require('../../../config/setting')
const axios = require('../client')
const ClientService = require('../util/clientService')

function bestController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.BEST : Setting.LOCAL.BEST,
    FROM_CACHE: false,
    /**
     * Call API to delivery
     * @param req
     * @param res
     * @param dataDelivery
     * @returns
     */
    getPriceFromDelivery: (req, res, dataDelivery) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery).then(response => {
          response.data.fromCache = false
          response.data.code = true
          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let data = {
              code: false,
              ServiceId: dataDelivery.ServiceId,
              msg: 'Không thể kết nối đến máy chủ của BEST'
            }
            return resolve(data)
          } else {
            error.response.data.ServiceId = dataDelivery.ServiceId
            return resolve(error.response.data)
          }

        })
      })
    },

    /**
     * Convert data
     * @param dataRequest
     * @param service
     * @returns
     */
    prepareDataToDelivery: (dataRequest, service) => {
      return {
        ServiceId: parseInt(service),
        UserName: dataRequest.UserName,
        SourceDistrictId: dataRequest.SourceDistrictId,
        SourceAddress: dataRequest.SourceAddress,
        SourceWard: dataRequest.SourceWard,
        SourceDistrict: dataRequest.SourceDistrict,
        SourceCity: dataRequest.SourceCity,
        DestDistrictId: dataRequest.DestDistrictId,
        DestAddress: dataRequest.DestAddress,
        DestWard: dataRequest.DestWard,
        DestDistrict: dataRequest.DestDistrict,
        DestCity: dataRequest.DestCity,
        ProductPrice: parseInt(dataRequest.ProductPrice),
        COD: parseInt(dataRequest.COD),
        Weight: parseInt(dataRequest.Weight),
        Length: parseInt(dataRequest.Length),
        Width: parseInt(dataRequest.Width),
        Height: parseInt(dataRequest.Height),
        DiscountCode: dataRequest.DiscountCode,
      }
    }
  };

  return {
    /**
     * API server for php call
     * @param req
     * @param res
     * @returns
     */
    getPrice: async (req, res) => {
      let services = req.body.services
      let dataRequest = JSON.parse(JSON.stringify(req.body.data))
      let checkRequest = !(dataRequest.COD > 0 || dataRequest.ProductPrice); // Neu co COD hoac khai gia thi ko luu cache
      let isTrial = req.body.isTrial
      return Promise.all(
        services.map(service => {
          let dataDelivery = self.prepareDataToDelivery(dataRequest, service)

          let from = dataDelivery.SourceDistrict + ' - ' + dataDelivery.SourceCity;
          let to = dataDelivery.DestDistrict + ' - ' + dataDelivery.DestCity;
          let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataDelivery.ServiceId, from,
            to, dataDelivery.Weight, dataDelivery.Length, dataDelivery.Width, dataDelivery.Height, dataDelivery.DiscountCode)

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
            let from = dataRequest.SourceDistrict + ' - ' + dataRequest.SourceCity;
            let to = dataRequest.DestDistrict + ' - ' + dataRequest.DestCity;
            let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, result.data.ServiceId, from,
              to, dataRequest.Weight, dataRequest.Length, dataRequest.Width, dataRequest.Height, dataRequest.DiscountCode)
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

module.exports = new bestController()