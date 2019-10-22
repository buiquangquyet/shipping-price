
function ClientService() {
  this.genKeyCache = function (clientCode, serviceId, from, to, weight, length = 0, width = 0, height = 0) {
    return clientCode+ '_' + serviceId + '_' + from + '_' + to + '_'
      + weight + '_' + length + '_' + width + '_' + height
  }
}

module.exports = new ClientService()