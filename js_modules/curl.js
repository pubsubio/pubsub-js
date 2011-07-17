if (typeof XMLHttpRequest == 'undefined') {
	XMLHttpRequest = function () {
		try {
			return new ActiveXObject('Msxml2.XMLHTTP.6.0');
		} catch (e) {}
		try {
			return new ActiveXObject('Msxml2.XMLHTTP.3.0');
		} catch (e) {}
		try {
			return new ActiveXObject('Microsoft.XMLHTTP');
		} catch (e) {}
		
		// Microsoft.XMLHTTP points to Msxml2.XMLHTTP and is redundant
		throw new Error('This browser does not support XMLHttpRequest.');
	};
}

var noop = function() {};
	
var pool = [];
var request = function(method, url, data, callback) {
	var xhr = pool.length ? pool.pop() : new XMLHttpRequest();
	
	var onresponse = function() {
		pool.push(xhr);
		callback(!(/2\d\d/.test(xhr.status)) && new Error('invalid status='+xhr.status), xhr.responseText);
	};

	xhr.open(method, url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) {
			return;
		}
		xhr.onreadystatechange = noop;
		setTimeout(onresponse, 1); // push it to the event stack
	};
	xhr.send(data);
	
	return function() {
		xhr.onreadystatechange = noop;
		xhr.abort();
		callback(new Error('request aborted'));
	};
};

exports.cors = ('withCredentials' in new XMLHttpRequest());
	
exports.get = function(url, callback) {
	return request('GET', url, null, callback);
};
exports.post = function(url, data, callback) {
	if (typeof data === 'function') {
		callback = data;
		data = null;
	}
	return request('POST', url, data, callback || noop);
};

exports.jsonp = function() {
	var globalScope = window._tmp_jsonp = {}; // A global variable to reference jsonp closures
	var prefix = 'cb'+(new Date()).getTime();
	var inc = 0;
	
	var addEvent = function(name, fn) {
		if (window.attachEvent) {
			window.attachEvent('on'+name, fn);
		} else {
			window.addEventListener(name, fn, false);
		}
	};
	
	// TODO: possible ie mem leaks here due to dom closures - examine
	return function(url, options, callback) {
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};
		callback = callback || noop;
		
		var id = prefix+inc++;
		var ended = false;

		var onresult = function(err, result) {
			ended = true;

			var el = document.getElementById(id);
			
			if (el) {
				el.onreadystatechange = noop;
				el.parentNode.removeChild(el);
			}
			el = null; // no mem leaks

			delete globalScope[id];

			callback(err, result);
		};

		globalScope[id] = function(result) {
			if (options.strict && (result === undefined || result === null || result.error)) {
				var err = new Error((result && result.error) || 'result is undefined or null');
				
				if (result) {
					for (var i in result) {
						err[i] = result[i];
					}
				}
				onresult(err);
				return;
			}
			onresult(null, result);
		};

		url = url.replace(/(\?|\&)(callback|jsonp)=\?/, '$1$2=_tmp_jsonp.'+id);

		var async = function() {
			if (ended) {
				return;
			}
			var el = document.createElement('script');

			el.async = true;
			el.src = url;
			el.id = id;

			document.body.appendChild(el);
		};
		
		if (document.body || options.async) {
			if (document.body) {
				async();
			} else {
				addEvent('load', async);
			}
		} else {
			document.write(unescape('%3Cscript')+' src="'+url+'" id="'+id+'"'+unescape('%3E%3C/script%3E'));
		}
		
		var script = document.getElementById(id);
		
		script.onreadystatechange = function() {
			if (ended || (this.readyState !== 'loaded' && this.readyState !== 'complete')) {
				return;
			}
			onresult(new Error('jsonp request failed'));								
		};
		
		return function() {
			onresult(new Error('jsonp request was cancelled'));
		};
	};
}();

/*
exports.jsonp2 = function() {
	var globalScope = window._tmp_jsonp = {}; // A global variable to reference jsonp closures
	var prefix = 'cb'+(new Date()).getTime();
	var cnt = 0;

	var addScript = function(url) {
		var id = '_tmp_jsonp_'+(cnt++);

		// we prefer adding to the body as this is non blocking (citation needed)
		if (document.body) {
			var el = document.createElement('script');

			el.async = 'async';
			el.src = url;
			el.id = id;

			document.body.appendChild(el);
		} else {
			document.write(unescape('%3Cscript')+' src="'+url+'" id="'+id+'"'+unescape('%3E%3C/script%3E'));
		}

		return document.getElementById(id);
	};
	
	return function(url, options, callback) {
		
	};
}();
*/