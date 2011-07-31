var pubsub = require('../index').connect('/example');
var sign = pubsub.signer('f2boE8yi2NQzmnGXX1Ve/YkFIwE=');

pubsub.subscribe(sign({hello:'world'}),console.log);

pubsub.publish({hello:'world'},{hello:1});
/*
var pubsub = require('pubsub.io').connect('ian:secret_pass@hub.pubsub.io/mysubhub');

//token = pubsub.token(JSON.stringify(token));
//console.log(token);

// ------------------------------

var key = ...
var pubsubio = require('pubsub.io');
var sign = pubsubio.signer(key);
var pubsub = pubsubio.connect(..., key);


// -------------------------------

var pubsub = require('pubsub.io').connect(key, ...);

var server = require('router').create();

server.get('/authenticate/{user}/{password}',function(req,res) {
	...
});
...
// trusted client
pubsub.publish({origin:'dr'});
pubsub.subscribe();

// client
pubsub.subscribe({as:1,we:1,orgin: {$trusted:1, $any:'dr'}});


// auth - no pubsubbing

var sign = require('pubsub.io').signer(key);

// auth - with pubsubbing

var pubsub = require('pubsub.io').connect(url, key);
var sign = pubsub.sign;
*/