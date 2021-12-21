const axios = require('../../../client')
const md5 = require('md5');
const baseService = require('./baseService')
const formUrlEncoded = x =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

const jtService = {
    getPriceFromDelivery: (req, res, service) => {
      let serviceId = service.service
      //nếu dữ liệu bên php không check giá được thì cần parse lại data
      // let dataRequestDelivery = JSON.parse(JSON.stringify(service))
      // let dataDelivery = jtService.prepareDataToDelivery(dataRequestDelivery)

      let headers = req.body.headers
      let domain = req.body.domain
      return new Promise((resolve, reject) => {
          return axios.post(domain, formUrlEncoded(service), {
              headers: headers
          }).then(response => {
              response.data.responseitems[0].serviceId = serviceId
              return resolve(response.data)
          }).catch(error => {
            return baseService.prepareDataError(resolve, reject, error)
              
          }) 
      })
    },
    getDataDigest: (logisticInterface, apiKey) => {
      let string = logisticInterface + apiKey
      var hash = md5(string)
    //  let buff = new Buffer(hash)
      return Buffer.from(hash).toString('base64')
    },
    prepareDataToDelivery: (dataRequest) => {
      let logisticsInterface = JSON.parse(dataRequest.logistics_interface)
      logisticsInterface.producttype = dataRequest.service

      return {
        msg_type: dataRequest.msg_type,
        eccompanyid: dataRequest.eccompanyid,
        logistics_interface: JSON.stringify(logisticsInterface),
        data_digest: jtService.getDataDigest(JSON.stringify(logisticsInterface), dataRequest.api_key)
      }
    }
}

module.exports = jtService