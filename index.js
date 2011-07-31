var sockets = require('json-sockets');
var common = require('common');

if (typeof JSON === 'undefined') {
	JSON = require('JSON')
}

var noop = function() {};

var parse = function(host) {
	if (host && typeof host === 'object') {
		return host;
	}
	
	var result = ((host || '').match(/([^:\/]*)(?::(\d+))?(?:\/(.*))?/) || []).slice(1);
	
	return {
		host: result[0] || 'localhost',
		port: parseInt(result[1] || (module.browser ? 80 : 10547), 10),
		sub: result[2] || '/'
	};
};
var normalize = function(query) {
	for (var i in query) {
		if (Object.prototype.toString.call(query[i]) === '[object RegExp]') {
			query[i] = {$regex:''+query[i]};
			continue;
		}
		if (typeof query === 'object') {
			query[i] = normalize(query[i]);
			continue;
		}
	}
	return query;
};

exports.connect = function(host) {
	host = parse(host);

	var socket = sockets.connect(host.host + ':' + host.port);

	var pubsub = {};
	var subscriptions = {};
	
	socket.send({sub:host.sub});
	
	socket.on('message', function(message) {
		if (message.name === 'publish') {
			(subscriptions[message.id] || noop)(message.doc);
		}
	});
	
	pubsub.signer = exports.signer;
	pubsub.subscribe = function(query, selection, callback) {
		if (!callback) {
			callback = selection;
			selection = undefined;
		}

		var id = common.gensym();

		subscriptions[id] = callback;

		socket.send({name:'subscribe', id:id, query:normalize(query), selection:selection});
		
		return function() {
			delete subscriptions[id];
			socket.send({name:'unsubscribe', id:id});
		};
	};
	pubsub.publish = function(doc, challenge) {
		socket.send({name:'publish', doc:doc, challenge:challenge});
	};
	
	return pubsub;
};

if (!module.browser) {
	var signer = require("signer");

	exports.signer = function(secret) {	
		var sign = signer.create(typeof secret === 'string' ? new Buffer(secret, 'base64') : secret);
		
		return function(doc) {
			var signed = {};
		
			for (var i in doc) {
				signed[i] = {$signature:sign.sign(i.replace(/\//g, '-') + '/' + doc[i]), value:doc[i]};
			}
			return signed;
		};
	};
}