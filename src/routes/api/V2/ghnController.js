const Setting = require('../../../../config/setting')
const axios = require('../../client')
const ClientService = require('../../util/clientService')

function ghnController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.V2.GHN : Setting.LOCAL.V2.GHN,
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
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery, {
          headers: {
            'Content-Type': 'application/json',
            'Token': self.INFO_DELIVERY.token,
            'ShopId': parseInt(dataDelivery.shop_id),
          },
        }).then(response => {
          response.data.fromCache = false
          response.data.code = true
          response.data.serviceId = dataDelivery.service_type_id
          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let data = {
              code: false,
              serviceId: 2,
              msg: 'Không thể kết nối đến máy chủ của hãng'
            }
            return resolve(data)
          } else {
            error.response.data.serviceId = 2
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
        shop_id: dataRequest.shop_id,
        service_id: dataRequest.service_id,
        service_type_id: service ? parseInt(service) : dataRequest.service_type_id,
        insurance_value: parseInt(dataRequest.insurance_value),
        pick_station_id: dataRequest.pick_station_id,
        from_district_id: dataRequest.from_district_id,
        from_ward_code: dataRequest.from_ward_code,
        to_district_id: dataRequest.to_district_id,
        to_ward_code: dataRequest.to_ward_code,
        height: parseInt(dataRequest.height),
        length: parseInt(dataRequest.length),
        width: parseInt(dataRequest.width),
        weight: parseInt(dataRequest.weight),
        coupon: dataRequest.coupon,
      }
    },
    /**
     * Generate keyCache
     * @param dataDelivery
     * @param isTrial
     * @returns
     */
    genKeyCache : (dataDelivery, isTrial) => {
      let from = dataDelivery.from_ward_code + '-' + dataDelivery.from_district_id;
      let to = dataDelivery.to_ward_code + '-' + dataDelivery.to_district_id;
      let coupon = dataDelivery.coupon;
      if (!dataDelivery.coupon) {
        coupon = 'NO_COUPON'
      }
      return ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataDelivery.service_type_id, from,
        to, dataDelivery.weight, dataDelivery.length, dataDelivery.width, dataDelivery.height, coupon)
    },
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
      let checkRequest = !(dataRequest.insurance_value > 0 || dataRequest.pick_station_id > 0); // Neu co COD hoac khai gia hoac gui buu cuc thi ko luu cache
      let isTrial = req.body.isTrial
      return Promise.all(
        services.map(service => {
          let dataDelivery = self.prepareDataToDelivery(dataRequest, service)
          let keyCache = self.genKeyCache(dataDelivery, isTrial)

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
            let keyCache = self.genKeyCache(dataRequest, isTrial)
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