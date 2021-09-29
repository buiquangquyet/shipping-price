const Setting = require('../../../../config/setting')
const axios = require('../../client')
const ClientService = require('../../util/clientService')
const qs = require('qs');

function AhaMoveController() {
    const self = {
        INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.V2.AHAMOVE : Setting.LOCAL.V2.AHAMOVE,
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
                let paramaters = {
                    token: dataDelivery.token,
                    order_time: dataDelivery.order_time,
                    service_id: dataDelivery.service_id,
                    path: JSON.parse(JSON.stringify(dataDelivery.path)),
                    payment_method: dataDelivery.payment_method
                }
                return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url , qs.stringify(paramaters), {
                }).then(response => {
                    response.data.serviceId = dataDelivery.service_id
                    return resolve(response.data)
                }).catch(error => {
                    if (error.code && error.code === 'ECONNABORTED') {
                        let msgErr = 'Không thể kết nối đến máy chủ của hãng'
                        if (error.message !== undefined && error.message.length > 0) {
                            msgErr = error.message;
                        }
                        let data = {
                            code: false,
                            serviceId: 2,
                            msg: msgErr
                        }
                        return resolve(data)
                    } else {
                        error.response.data.serviceId = 2
                        return resolve(error.response.data)
                    }

                })
            })
        }
    };

    return {
        /**
         * API server for php call
         * @param req
         * @param res
         * @returns
         */
        getPrice: async (req, res) => {
            let services = req.body.services
            let dataServices = req.body.dataServices || [] //extra field when udpate check price with weight exchange
            let dataRequest = JSON.parse(JSON.stringify(req.body.data))
            let checkRequest = !(dataRequest.ORDER_SERVICE_ADD || dataRequest.MONEY_COLLECTION !== 0)

            let isTrial = req.body.isTrial
            return Promise.all(
                dataServices.map(dataService => {
                    let dataDelivery = JSON.parse(JSON.stringify(dataService.data))
                    dataDelivery.token = req.body.token
                    // console.log(dataDelivery)
                    let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, dataService.service, dataRequest.SENDER_WARD_ID,
                        dataRequest.RECEIVER_WARD_ID, dataRequest.PRODUCT_WEIGHT, dataRequest.PRODUCT_LENGTH,
                        dataRequest.PRODUCT_WIDTH, dataRequest.PRODUCT_HEIGHT, dataDelivery.promo_code)
                    console.log('dataDelivery', dataRequest)
                    //====================
                    // let service = 'default'
                    //
                    // let from = dataRequestDelivery.SenderDistrictId + '_' + dataRequestDelivery.SenderProvinceId
                    // let to = dataRequestDelivery.ReceiverDistrictId + '_' + dataRequestDelivery.ReceiverProvinceId
                    // let keyCache = ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, service, from, to, dataRequestDelivery.Weight,
                    //     dataRequestDelivery.Length, dataRequestDelivery.Width, dataRequestDelivery.Height)
                    //====================


                    return ClientService.checkCachePrice(keyCache, true)
                        .then(result => {
                            if (result.s === 200) {
                                result.data.fromCache = true
                                return result.data
                            }
                            return null
                        }).then(resultCache => {
                            if (!resultCache) { // nếu k có cache thì sẽ gọi lên hãng
                                console.log('xx')
                                return self.getPriceFromDelivery(req, res, dataDelivery)
                            }
                            return resultCache
                        })
                })
            ).then(results => {
                results.map(result => {
                    // nếu thành công thì ghi vào log - check thêm điều kiện có dvmr hay không và có hiện đang kết nối được vs redis hay không
                    if (result.code && checkRequest && checkConnectRedis && !result.fromCache) {
                        // let keyCache = self.genKeyCache(dataRequest, isTrial)
                        // ClientService.setPriceToCache(keyCache, result, isTrial)
                    }
                })

                return res.json({s: 200, data: results})
            }).catch(error => {
                return res.json({s: 500, data: error.message})
            })
        }
    }
}

module.exports = new AhaMoveController()