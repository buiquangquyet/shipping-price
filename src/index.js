const debug = require('debug')('server:debug');
const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const Setting = require('../config/setting');
const home = require('./routes/home');
const corsOptions = {
  credentials: true,
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, x-xsrf-token'
}

const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.enable('trust proxy')
app.disable('x-powered-by')
app.use('/api/v1', home);
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
