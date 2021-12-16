const axios = require('../../../client')

const bestService = {
    getPriceFromDelivery: (req, res, service) => {
      let serviceId = service.service
      let domain = req.body.domain
      return new Promise((resolve, reject) => {
          return axios.post(domain, service).then(response => {
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
    checkPrice:(req, res) => {
      let services = req.body.data
      return Promise.all(
        services.map(service => {
            return bestService.getPriceFromDelivery(req, res, service)
        })
      ).then(results => {
          return res.json({s: 200, data: results})
      }).catch(error => {
          return res.json({s: 500, data: error.message})
      })
    }
}

module.exports = bestService