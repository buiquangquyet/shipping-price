const debug = require('debug')('server:debug');
const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const priceRouter = require('./routes/price');
const app=express();

app.use(bodyParser.urlencoded({ extended: true }));

 //sets the limit of json bodies in the req body.
 app.use(bodyParser.json());
 app.use('/api/v1/',priceRouter);

const listen =app.listen(config.get('port'),()=>{
    debug(`server is running on port ${config.get('port')} and in ${config.get('name')} mode`);
    console.log(`server is running on port ${config.get('port')} and in ${config.get('name')} mode`);
})

module.exports= app;
module.exports.port=listen.address().port;