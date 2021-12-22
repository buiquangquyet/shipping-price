const axios = require('../../../client')

const baseService = {
  CLIENT_CODE_VNP: 'VNP',
  CLIENT_CODE_JT: 'J&T',
  CLIENT_CODE_BEST: 'BEST',
  CLIENT_CODE_AHAMOVE: 'AHAMOVE',
  CLIENT_CODE_VTP: 'VTP',
  CLIENT_CODE_VTPFW: 'VTPFW',
  TYPE_SINGLE: 'SINGLE',
  TYPE_MULTIPLE: 'MULTIPLE',
  /**
   * Call API to delivery
   * @param req
   * @param res
   * @param service
   * @returns
   */
  getPriceFromDelivery: (req, res, service) => {
    let headers = req.body.headers
    let domain = req.body.domain
    let serviceId = ''
    if(service.service) {
        serviceId = service.service
    } 
    if(service.service_type_id) {
        serviceId = service.service_type_id
    }
     //--------- PREPARE VTP ---------
    if(service.ORDER_SERVICE) {
      serviceId = service.ORDER_SERVICE
    }
    return new Promise((resolve, reject) => {
        return axios.post(domain, service, {
            headers: headers
        }).then(response => {
          if(serviceId !== '') {
            response.data.serviceId = serviceId
          }
          return resolve(response.data)
        }).catch(error => {
            return baseService.prepareDataError(resolve, reject, error)
        }) 
    })
  },
  prepareStatus: (results) => {
    let status = 200;
    results.forEach(function(result, index) {
        if(index == 0) {
            status = result.s ? result.s : 500
        }
    })
    return status
  },
  prepareDataError: (resolve, reject, error) => {
    let msgErr = 'Không thể kết nối đến máy chủ của hãng'
    let data = {
        message: msgErr,
    }
    if (error.code && error.code === 'ECONNABORTED') {
        if (error.message !== undefined && error.message.length > 0) {
          data.message = error.message;
        }
        return resolve({s: 504, data: data})
    } 
    let status = 500
    if(error.response) {
        let data = error.response.data
        if(data.length == 0) {
            data = {
                message: msgErr,
            }
            return resolve({s: status, data: data})
        }
        if(error.response.request.res.statusCode) {
            status = error.response.request.res.statusCode
        }
        if(data.message === undefined || data.message.length == 0) {
          data.message = msgErr
        }
        return resolve({s: status, data: data})
    }
    return reject(error)
  }
}

module.exports = baseService