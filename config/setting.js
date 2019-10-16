let SETTING = {
  IS_PRODUCTION: false,
  PRODUCTION: {
  },
  LOCAL: {
    NAME: "Server Developement",
    DATABASE: "mongodb://localhost:27017/development",
    PORT: 3000,
    URL: "",
    REDIS_URL: "redis://localhost:6379",
    GHN: {
      "domain": "https://dev-online-gateway.ghn.vn",
      "price_url": "/apiv3-api/api/v1/apiv3/CalculateFee",
      // "username": "giaovan@kiotviet.com",
      // "password": "Giaovan@321",
      // "token":"TokenStaging"
    }
  }
}
module.exports = SETTING