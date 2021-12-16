const axios = require('../../../client')
const baseService = require('./baseService')
const formUrlEncoded = x =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

const jtService = {
    getPriceFromDelivery: (req, res, service) => {
      let serviceId = service.service
      let headers = req.body.headers
      let domain = req.body.domain
      return new Promise((resolve, reject) => {
          return axios.post(domain, formUrlEncoded(service), {
              headers: headers
          }).then(response => {
              response.data.responseitems[0].serviceId = serviceId
              return resolve({s: 200 ,data: response.data})
          }).catch(error => {
            return baseService.prepareDataError(resolve, reject, error)
              
          }) 
      })
    }
}

module.exports = jtService