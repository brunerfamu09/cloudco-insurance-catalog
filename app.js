var express = require('express');
var bodyParser = require('body-parser');
var cfenv = require("cfenv");
var path = require('path');
var cors = require('cors');

// Setup the required environment variables
var vcapLocal = null;
try {
  vcapLocal = require("./vcap-local.json");
}
catch (e) {}

var appEnvOpts = vcapLocal ? {vcap:vcapLocal} : {};
var appEnv = cfenv.getAppEnv(appEnvOpts);

// Setup services
var appName;
if (appEnv.isLocal) {
    require('dotenv').load();
    appName = process.env.CF_APP_NAME;
}
else {
    appName = JSON.parse(process.env.VCAP_APPLICATION).name;
}
try {
	cloudantService = appEnv.services.cloudantNoSQLDB[0];
	tradeoffService = appEnv.getService("insurance-tradeoff-analytics").credentials;
	tradeoffService.version = 'v1';
}
catch (e) {
	console.error("Error looking up service: ", e);
}

// Setup route handlers
var policies = require('./routes/policies');
var tradeoff = require('./routes/tradeoff');

// Setup express middleware.
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'www')));

// REST HTTP Methods
app.get('/db/:option', policies.dbOptions);
app.get('/policies', policies.list);
app.get('/fib', policies.fib);
app.get('/loadTest', policies.loadTest);
app.get('/policies/:id', policies.find);
app.post('/policies', policies.create);
app.put('/policies/:id', policies.update);
app.delete('/policies/:id', policies.remove);

// We add this route to access evaluate() in routes/tradeoff.js
app.post('/tradeoff', tradeoff.evaluate);

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("catalog server starting on " + appEnv.url);
});
