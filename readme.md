Setup:
> yarn init
> yarn add mocha chai debug supertest nodemon babel-cli babel-preset-node8 config request --dev
(refrence link: https://medium.com/developer-circles-lusaka/how-to-write-an-express-js-server-using-test-driven-development-921dc55aec07)

Run unit test:
> yarn run test

Start develoment site:
> yarn run dev

Build production package:
> yarn run build

Start production site:
> yarn run serve

Add shipping client config:
- Go to config json file (i.e: config/development.json)
- Add new node:
    "client_code": {
        "key1": "value1",
        "key2": "value2"
    }