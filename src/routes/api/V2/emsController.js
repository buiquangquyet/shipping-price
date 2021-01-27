const Setting = require('../../../../config/setting')
const axios = require('../../client')
const { data } = require('../../requestLogger')
const ClientService = require('../../util/clientService')

function emsController() {
    const self = {
        INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.V2.EMS : Setting.LOCAL.V2.EMS,
        FROM_CACHE: false,
        /**
         * Call API to delivery
         * @param req
         * @param res
         * @param dataDelivery
         * @returns
         */
        getPriceFromDelivery: (req, res, dataDelivery) => {
            return new Promise((resolve, reject) => {
                return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataDelivery, {
                    headers: {
                        'Content-Type': 'application/json',
                        'merchant_token': self.INFO_DELIVERY.token
                    }
                }).then(response => {
                    response.data.fromCache = false
                    response.data.code = true
                    response.data.serviceId = dataDelivery.service
                    return resolve(response.data)
                }).catch(error => {
                    if (error.code && error.code === 'ECONNABORTED') {
                        let msgErr = 'Không thể kết nối đến máy chủ của hãng'
                        if (error.message !== undefined && error.message.length > 0) {
                            msgErr = error.message;
                        }
                        let data = {
                            code: false,
                            serviceId: dataDelivery.service,
                            msg: msgErr
                        }
                        return resolve(data)
                    } else {
                        if (error.response) {
                            error.response.data.serviceId = dataDelivery.service
                            return resolve(error.response.data)
                        } else { //undefined error.response
                            return reject(error)
                        }
                    }
                }) 
            })
        },
        /**
         * Convert data
         * @param dataRequest
         * @param service
         * @returns
         */
        prepareDataToDelivery: (dataRequest, service) => {
            return {
                from_province: dataRequest.from_province,
                from_district: dataRequest.from_district,
                from_ward: dataRequest.from_ward,
                to_province: dataRequest.to_province,
                to_district: dataRequest.to_district,
                to_ward: dataRequest.to_ward,
                service: service ? parseInt(service) : dataRequest.service,
                vas: dataRequest.vas,
                money_collect: parseInt(dataRequest.money_collect),
                total_quantity: parseInt(dataRequest.total_quantity),
                total_amount: parseInt(dataRequest.total_amount),
                total_weight: parseInt(dataRequest.total_weight),
                size: dataRequest.size
            }
        },
        /**
         * Generate keyCache
         * @param dataDelivery
         * @param isTrial
         * @returns
         */
        genKeyCache : (dataDelivery, isTrial) => {
            let from = dataDelivery.from_district + '-' + dataDelivery.from_province;
            let to = dataDelivery.to_district + '-' + dataDelivery.to_province;
            let coupon = dataDelivery.coupon;
            if (!dataDelivery.coupon) {
                coupon = 'NO_COUPON'
            }
            let sizeArr = dataDelivery.size.split('x')
            return ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataDelivery.service, from,
            to, dataDelivery.total_weight, sizeArr[0], sizeArr[1], sizeArr[2], coupon)
        }
    }

    return {
        /**
         * API server for php call
         * @param req
         * @param res
         * @returns
         */
        getPrice: (req, res) => {
            let services = req.body.services
            let dataRequest = JSON.parse(JSON.stringify(req.body.data))
            let checkRequest = !(dataRequest.vas.length > 0 || dataRequest.money_collect > 0) // Nếu có COD hoặc extra service thì không lưu cache
            let isTrial = req.body.isTrial
            return Promise.all(
                services.map(service => {
                    let dataDelivery = self.prepareDataToDelivery(dataRequest, service)
                    let keyCache = self.genKeyCache(dataDelivery, isTrial)
                    
                    return ClientService.checkCachePrice(keyCache, checkRequest)
                        .then(result => {
                            if (result.s === 200) {
                                result.data.fromCache = true
                                return result.data
                            }
                            return null
                        }).then(resultCache => {
                            if (!resultCache) { // nếu k có cache thì sẽ gọi lên hãng
                                return self.getPriceFromDelivery(req, res, dataDelivery)
                            }
                            return resultCache
                        })
                })
            ).then(results => {
                results.map(result => {
                    // nếu thành công thì ghi vào log - check thêm điều kiện có dvmr hay không và có hiện đang kết nối được vs redis hay không
                    if (result.code && checkRequest && checkConnectRedis && !result.fromCache) {
                        let keyCache = self.genKeyCache(dataRequest, isTrial)
                        ClientService.setPriceToCache(keyCache, result, isTrial)
                    }
                })
                return res.json({s: 200, data: results})
            }).catch(error => {
                return res.json({s: 500, data: error.message})
            })
        }
    }
}

module.exports = new emsController()