const Setting = require('../../../../config/setting')
const axios = require('../../client')
const ClientService = require('../../util/clientService')

function grabController() {
  const self = {
    INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.V2.GRAB : Setting.LOCAL.V2.GRAB,
    FROM_CACHE: false,

    getPriceFromDelivery: (req, res, dataRequest) => {
      return new Promise((resolve, reject) => {
        return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataRequest,
            {headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '+ dataRequest.token
            }}).then(response => {
          return resolve(response.data)
        }).catch(error => {
          if (error.code && error.code === 'ECONNABORTED') {
            let msgErr = 'Không thể kết nối đến máy chủ của hãng'
            if (error.message !== undefined && error.message.length > 0) {
              msgErr = error.message;
            }
            let data = {
              success: false,
              msg: msgErr
            }
            return resolve(data)
          } else {
            return resolve({s: 500, data: error.response.data})
          }
        })
      })
    }
  }

  return {
    getPrice: async (req, res) => {
      let isTrial = req.body.isTrial
      let dataRequestDelivery = JSON.parse(JSON.stringify(req.body.data))
      let token = req.body.token;

      let checkRequest = parseInt(dataRequestDelivery.CashOnDelivery.amount) > 0 ? false : true
      let service = 'all' // với grab ko truyen service de check gia all

      let from = dataRequestDelivery.origin.address
      let to = dataRequestDelivery.destination.address
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
            dataRequestDelivery.token = token
            return self.getPriceFromDelivery(req, res, dataRequestDelivery).then(results => {
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

module.exports = new grabController()
