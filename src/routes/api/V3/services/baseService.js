const axios = require('../../../client')

const baseService = {
  CLIENT_CODE_VNP: 'VNP',
  CLIENT_CODE_JT: 'J&T',
  TYPE_SINGLE: 'SINGLE',
  TYPE_MULTIPLE: 'MULTIPLE',
  /**
   * Call API to delivery
   * @param req
   * @param res
   * @param dataDelivery
   * @returns
   */
  getPriceFromDelivery: (req, res, dataDelivery) => {
    let headers = req.body.headers
    let domain = req.body.domain
    let serviceId = ''
    if(dataDelivery.service) {
        serviceId = dataDelivery.service
    } 
    if(dataDelivery.service_type_id) {
        serviceId = dataDelivery.service_type_id
    }
    return new Promise((resolve, reject) => {
        return axios.post(domain, dataDelivery, {
            headers: headers
        }).then(response => {
          response.data.code = true
          if(serviceId !== '') {
              response.data.serviceId = serviceId
          }
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
  checkPrice:(req, res, services) => {
    return Promise.all(
      services.map(service => {
          return baseService.getPriceFromDelivery(req, res, service)
      })
    ).then(results => {
        return res.json({s: 200, data: results})
    }).catch(error => {
        return res.json({s: 500, data: error.message})
    })
  }
}

module.exports = baseService