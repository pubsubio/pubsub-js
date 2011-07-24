var JSON = require('JSON');
var common = require('common');
var curl = require('curl');

var PING_INTERVAL = 60*1000;

var noop = function() {};

var Request = function() {
	// basic ajax cors request
	// FF 3.5+, Chrome (Proxy), Safari (Proxy) IE8+

	var AJAX = function(host) {
		this.host = host;
	};

	AJAX.prototype.type = 'ajax';
	
	AJAX.prototype.get = function(path, callback) {
		this.destroy = curl.get(this.host+path, callback);
	};
	AJAX.prototype.post = function(path, body, callback) {
		this.destroy = curl.post(this.host+path, body, callback);
	};
	AJAX.prototype.destroy = noop;
	
	if (curl.cors) {
		return AJAX;
	}
		
	// epic fallback with jsonp
	// Everybody else (Opera has some issues with jsonp, but covered above)

	var sep = function(path) {
		return /\?/.test(path) ? '&' : '?';
	};

	var JSONP = function(host) { 
		this.host = host;
	};

	JSONP.prototype.type = 'jsonp';

	JSONP.prototype.get = function(path, callback) {
		this.destroy = curl.jsonp(this.host+path+sep(path)+'callback=?', callback);
	};
	JSONP.prototype.post = function(path, body, callback) {
		var i = 0;
		var host = this.host+path+sep(path);
		var self = this;

		var send = function() {
			var next = body.length <= (i+1)*1000 ? callback : common.fork(callback, send);
			var post = encodeURIComponent(body.substr(1000 * i++, 1000));

			self._destroy = curl.jsonp(host+'post='+post+'&callback=?', next);
		};

		send();
	};
	JSONP.prototype.destroy = noop;
	
	return JSONP;
}();

var createRequest = function(host) {
	host = 'http://' + (host || window.location.host) + '/json-sockets';
	
	return new Request(host);
};


var tick = function() {
	var now = common.encode((new Date()).getTime());
	var cnt = 0;

	return function() {
		return common.encode(cnt++) + now;		
	};
}();

var LongPoll = common.emitter(function(host) {
	this.reader = createRequest(host);
	this.writer = createRequest(host);
	
	var self = this;
	var reader = this.reader;
	var writer = this.writer;
	var cnt = 0;

	this.type = 'longpoll-'+reader.type;
	this.destroyed = false;
	this._ping = null;

	var onerror = function() {
		self.destroy();
	};
	var oncreate = function(id) {
		var buffer = [];

		var read = function(data) {
			if (data) {
				data = data.split('\n');
				
				for (var i = 0; i < data.length; i++) {
					if (!data[i] || data[i] === 'pong') {
						continue;
					}
					self.emit('message', JSON.parse(data[i]));								
				}
			}
			if (self.destroyed) {
				return;
			}
					
			reader.get('/read?id='+id+'&t='+tick(), common.fork(onerror, read));
		};
		var flush = function() {
			if (buffer.length) {
				var data = buffer.join('\n');
				
				buffer = [];
				send(data);						
			} else {
				self._send = send;							
			}
		};
		var pusher = function(data) {
			buffer.push(data);
		};
		var send = self._send = function(message) {
			self._send = pusher;
			writer.post('/write?id='+id+'&t='+tick(), message+'\n', common.fork(onerror, flush));
		};					
		
		self._ping = setInterval(function() {
			self._send('ping');
		}, PING_INTERVAL);
		
		read();
		self.emit('open');					
	};
	
	reader.get('/create?t='+tick(), common.fork(onerror, oncreate));
});

LongPoll.prototype.send = function(message) {
	this._send(JSON.stringify(message));
};
LongPoll.prototype.destroy = function() {
	if (this.destroyed) {
		return;
	}
	clearInterval(this._ping);

	this.destroyed = true;
	this.reader.destroy();
	this.writer.destroy();
	this.emit('close');
};

LongPoll.prototype._send = function() {
	throw new Error('socket is not writable');
};

var Socket = common.emitter(function(host) {
	var ws = this._ws = new WebSocket('ws://'+host+'/json-sockets');
	var self = this;
	var ping;
	
	ws.onopen = function() {
		ping = setInterval(function() {
			ws.send('ping');
		}, PING_INTERVAL);
		
		self.emit('open');			
	};
	ws.onmessage = function(e) {
		if (e.data === 'pong') {
			return;
		} 
		self.emit('message', JSON.parse(e.data));
	};
	ws.onclose = function() {
		clearInterval(ping);
		self.emit('close');
	};
});

Socket.prototype.type = 'web-socket';

Socket.prototype.send = function(message) {
	this._ws.send(JSON.stringify(message));
};
Socket.prototype.destroy = function() {
	this._ws.close();
};


var CrossBrowser = window.WebSocket ? Socket : LongPoll;

var onload = function(fn) {
	if (document.body) {
		fn();
		return;
	}
	(window.addEventListener || window.attachEvent)(window.attachEvent ? 'onload' : 'load', fn, false);
};

var SocketBuffer = common.emitter(function(host) {
	var self = this;
	
	this._buffer = [];
	
	onload(function() {
		if (self._destroyed) {
			return;
		}
		var sock = self._sock = new CrossBrowser(host);
		var destroyed = false;
		
		var destroy = function() {
			sock.destroy();
		};
		
		self.type = sock.type;
		self.destroy = function() {
			destroyed = true;
		};
		
		sock.on('open', function() {
			if (destroyed) {
				destroy();
				return;
			}
			while (self._buffer.length) {
				self._send(self._buffer.shift());
			}
			self.send = self._send;
			self.destroy = destroy;

			self.emit('open');
		});
		sock.on('message', function(message) {
			self.emit('message', message);
		});
		sock.on('close', function() {
			self.emit('close');
		});		
	});
});

SocketBuffer.prototype.send = function(message) {
	this._buffer.push(message);
};
SocketBuffer.prototype.destroy = function() {
	this._destroyed = true;
	this.emit('close');
};


SocketBuffer.prototype._send = function(message) {
	this._sock.send(message);
};

exports.connect = function(host) {
	host = host || window.location.host;

	return new SocketBuffer(host);
};