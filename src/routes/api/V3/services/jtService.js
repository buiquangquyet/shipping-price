const axios = require('../../../client')
const md5 = require('md5');
const baseService = require('./baseService')
const formUrlEncoded = x =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

const jtService = {
    getPriceFromDelivery: (req, res, service) => {
      let productInfo = req.body.data.product_info
      let dataDelivery = jtService.prepareDataToDelivery(service, productInfo)
      let serviceId = service.service
      let headers = req.body.headers
      let domain = req.body.domain
      return new Promise((resolve, reject) => {
          return axios.post(domain, formUrlEncoded(dataDelivery), {
              headers: headers
          }).then(response => {
              response.data.responseitems[0].serviceId = serviceId
              return resolve(response.data)
          }).catch(error => {
              if (error.code && error.code === 'ECONNABORTED') {
                  let msgErr = 'Không thể kết nối đến máy chủ của hãng'
                  if (error.message !== undefined && error.message.length > 0) {
                      msgErr = error.message;
                  }
                  let data = {
                      code: false,
                      serviceId: serviceId,
                      msg: msgErr
                  }
                  return resolve({s: 504, data: data})
              } 
              if(error.response) {
                  let status = 500
                  if(error.response.request.res.statusCode) {
                      status = error.response.request.res.statusCode
                  }
                  return resolve({s: status, data: error.response.data})
              }
              return reject(error)
              
          }) 
      })
    },
    getDataDigest: (logisticInterface, apiKey) => {
      let string = logisticInterface + apiKey
      var hash = md5(string)
      return Buffer.from(hash).toString('base64')
    },
    prepareDataToDelivery: (service, productInfo) => {
      let logisticsInterface = JSON.parse(service.logistics_interface)
      logisticsInterface.producttype = service.service
      return {
        msg_type: service.msg_type,
        eccompanyid: service.eccompanyid,
        logistics_interface: JSON.stringify(logisticsInterface),
        data_digest: jtService.getDataDigest(JSON.stringify(logisticsInterface), productInfo.api_key)
      }
    },
    checkPrice:(req, res) => {
      let services = req.body.data.services
      return Promise.all(
        services.map(service => {
            return jtService.getPriceFromDelivery(req, res, service)
        })
      ).then(results => {
          return res.json({s: 200, data: results})
      }).catch(error => {
          return res.json({s: 500, data: error.message})
      })
    }
}

module.exports = jtService