const debug = require('debug')('server:debug');
const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const Setting = require('../config/setting');
const home = require('./routes/home');
const home2 = require('./routes/home2');
const redis = require('redis');

// connect to Redis
const Redis = Setting.IS_PRODUCTION ? Setting.PRODUCTION.REDIS : Setting.LOCAL.REDIS;
global.clientRedis = redis.createClient({host: Redis.host, port: Redis.port, password: Redis.pass});
global.checkConnectRedis = false
clientRedis.on('connect', () => {
  checkConnectRedis = true
  console.log(`connected to redis`);
});

clientRedis.on('error', err => {
  console.log(`Error: ${err}`);
});

const corsOptions = {
  credentials: true,
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, x-xsrf-token'
}

const cors = require('cors');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use('/api/v1', home);
app.use('/api/v2', home2);
app.use('/', (req, res) => {
  return res.send('Router not found')
});

app.listen(Setting.IS_PRODUCTION ? Setting.PRODUCTION.PORT : Setting.LOCAL.PORT, function () {
  console.log(`Example app listening on port ${Setting.IS_PRODUCTION ? Setting.PRODUCTION.PORT : Setting.LOCAL.PORT}`)
});

// const listen =app.listen(config.get('port'),()=>{
//     debug(`server is running on port ${config.get('port')} and in ${config.get('name')} mode`);
//     console.log(`server is running on port ${config.get('port')} and in ${config.get('name')} mode`);
// })
