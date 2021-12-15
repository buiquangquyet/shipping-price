const axios = require('../../../client')
const baseService = require('./baseService')

const vnpService = {
    getPriceFromDelivery: (req, res, dataDelivery) => {
        let method = req.body.method
        let clientCode = req.body.client_code
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
    checkPrice: (req, res, services) => {
        return vnpService.getPriceFromDelivery(req, res, services).then(results => {
            let status = results.s ? results.s : 200
            return res.json({s: status, data: results})
        })
    }
}

module.exports = vnpService