
function ClientService() {
  this.genKeyCache = function (clientCode, serviceId, from, to, weight, length = 0, width = 0, height = 0) {
    return clientCode+ '_' + serviceId + '_' + from + '_' + to + '_'
      + weight + '_' + length + '_' + width + '_' + height
  },
  this.checkCachePrice = function (keyCache, checkReqeust) {
    return new Promise((resolve, reject) => {
      if (!checkConnectRedis || !checkReqeust) {
        return resolve({
          s: 500, data: null
        })
      }
      return clientRedis.get(keyCache, (err, data) => {
        if (data) {

          return resolve({
            s: 200, data: JSON.parse(data)
          })
        }
        return resolve({
          s: 500, data: null
        })
      })
    })
  },
  this.setPriceToCache = function (keyCache, data) {
    clientRedis.setex(keyCache, 300, JSON.stringify(data))
  }
}

module.exports = new ClientService()