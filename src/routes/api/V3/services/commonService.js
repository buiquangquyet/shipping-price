const axios = require('../../../client')
const baseService = require('./baseService')

const commonService = {
    getPriceFromDelivery: (req, res, services) => {
        let headers = req.body.headers
        let domain = req.body.domain
        return new Promise((resolve, reject) => {
            return axios.post(domain, services, {
                headers: headers
            }).then(response => {
                return resolve({s: 200 ,data: response.data})
            }).catch(error => {
                return baseService.prepareDataError(resolve, reject, error)
            }) 
        })
    },
    checkPrice:(req, res, services) => {
        return commonService.getPriceFromDelivery(req, res, services)
            .then(results => {
                let status = results.s ? results.s : 500
                return res.json({s: status, data: results.data});
        })
    }
}

module.exports = commonService