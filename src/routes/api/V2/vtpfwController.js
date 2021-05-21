const Setting = require('../../../../config/setting')
const axios = require('../../client')
const ClientService = require('../../util/clientService')

function vtpfwController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.V2.VTPFW : Setting.LOCAL.V2.VTPFW,
    FROM_CACHE: false,
    /**
     * Call API to delivery
     * @param req
     * @param res
     * @param dataDelivery
     * @param token
     * @returns
     */
    getPriceFromDelivery: (req, res, dataDelivery, token) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery, {
          headers: {
            'Content-Type': 'application/json',
            'Token': token,
          },
        }).then(response => {
          response.data.fromCache = false
          response.data.code = true
          response.data.serviceId = dataDelivery.ORDER_SERVICE
          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let msgErr = 'Không thể kết nối đến máy chủ của hãng'
            if (error.message !== undefined && error.message.length > 0) {
              msgErr = error.message;
            }
            let data = {
              code: false,
              serviceId: dataDelivery.ORDER_SERVICE,
              msg: msgErr
            }
            return resolve(data)
          } else {
            error.response.data.serviceId = dataDelivery.ORDER_SERVICE
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
        SENDER_PROVINCE: dataRequest.SENDER_PROVINCE,
        SENDER_DISTRICT: dataRequest.SENDER_DISTRICT,
        RECEIVER_PROVINCE: dataRequest.RECEIVER_PROVINCE,
        RECEIVER_DISTRICT: dataRequest.RECEIVER_DISTRICT,
        PRODUCT_WEIGHT: dataRequest.PRODUCT_WEIGHT,
        PRODUCT_PRICE: dataRequest.PRODUCT_PRICE,
        MONEY_COLLECTION: dataRequest.MONEY_COLLECTION,
        ORDER_SERVICE_ADD: dataRequest.ORDER_SERVICE_ADD,
        ORDER_SERVICE: service,
        PRODUCT_TYPE: dataRequest.PRODUCT_TYPE,
        NATIONAL_TYPE: dataRequest.NATIONAL_TYPE,
        COUPON: dataRequest.COUPON,
      }
    },
    /**
     * Generate keyCache
     * @param dataDelivery
     * @param isTrial
     * @returns
     */
    genKeyCache : (dataDelivery, isTrial) => {
      let from = dataDelivery.SENDER_DISTRICT;
      let to = dataDelivery.RECEIVER_DISTRICT;
      return ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataDelivery.ORDER_SERVICE, from,
        to, dataDelivery.PRODUCT_WEIGHT, 'NO_COUPON')
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
      let checkRequest = !(dataRequest.MONEY_COLLECTION > 0 || dataRequest.ORDER_SERVICE_ADD); // Neu co COD hoac khai gia hoac co dich vu mo rong ko luu cache
      let isTrial = req.body.isTrial
      let token = req.body.token
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
                return self.getPriceFromDelivery(req, res, dataDelivery, token)
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

module.exports = new vtpfwController()