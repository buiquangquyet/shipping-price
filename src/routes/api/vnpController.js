const Setting = require('../../../config/setting')
const axios = require('../client')
const ClientService = require('../util/clientService')
const md5 = require('md5');
const formUrlEncoded = x =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

function vnpController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.VNP : Setting.LOCAL.VNP,
    FROM_CACHE: false,

    getPriceFromDelivery: (req, res, dataRequest, serviceId) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataRequest, {headers: {'h-token': dataRequest.token}}).then(response => {
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
    }
  }

  return {
    getPrice: async (req, res) => {
      let isTrial = req.body.isTrial
      let services = req.body.services
      let dataRequestDelivery = JSON.parse(JSON.stringify(req.body.data))

      let checkRequest = dataRequestDelivery.UseBaoPhat || dataRequestDelivery.UseHoaDon || parseInt(dataRequestDelivery.OrderAmount) > 0
      || parseInt(dataRequestDelivery.CodAmount) > 0 ? false : true
      let service = 'default' // với VNP k cần là dịch vụ nào vì gọi lên là lấy hết

      let from = dataRequestDelivery.SenderDistrictId + '_' + dataRequestDelivery.SenderProvinceId
      let to = dataRequestDelivery.ReceiverDistrictId + '_' + dataRequestDelivery.ReceiverProvinceId
      let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, service, from, to, dataRequestDelivery.Weight,
        dataRequestDelivery.Length, dataRequestDelivery.Width, dataRequestDelivery.Height)

      return ClientService.checkCachePrice(keyCache, checkRequest)
        .then(result => {
          if (result.s === 200) {
            result.data.fromCache = true
            return result.data
          }
          return null
        }).then(resultCache => {
          if (!resultCache) { // nếu k có cache thì sẽ gọi lên hãng
            dataRequestDelivery.token = req.body.token
            return self.getPriceFromDelivery(req, res, dataRequestDelivery, service).then(results => {
              let status = results.s ? results.s : 200
              if (status === 200 && checkRequest && checkConnectRedis) {
                ClientService.setPriceToCache(keyCache, results, isTrial)
              }
              return res.json({s: status, data: results})
            })
          }
          return res.json({s: 200, data: resultCache})
        })
    }
  }
}

module.exports = new vnpController()