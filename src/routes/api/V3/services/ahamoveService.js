const axios = require('../../../client')

const ahamoveService = {
    getPriceFromDelivery: (req, res, services) => {
      let domain = req.body.domain
      let headers = req.body.headers
      return new Promise((resolve, reject) => {
          return axios.post(domain, services, {
            headers: headers
        }).then(response => {
            return resolve({s: 200 ,data: response.data})
        }).catch(error => {
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
                if(error.response.request.res.statusCode) {
                    status = error.response.request.res.statusCode
                }
                if(data.message === undefined || data.message.length == 0) {
                  data.message = msgErr
                }
                return resolve({s: status, data: data})
            }
            return reject(error)
        }) 
      })
    },
    checkPrice:(req, res) => {
      let services = req.body.data
      return ahamoveService.getPriceFromDelivery(req, res, services)
            .then(results => {
                let status = results.s ? results.s : 500
                return res.json({s: status, data: results.data});
            })
    }
}

module.exports = ahamoveService