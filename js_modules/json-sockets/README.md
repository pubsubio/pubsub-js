# JSON-Sockets-JS

A browser javascript client implementation for the JSON-Sockets server.

Usage:

```js
var socket = sockets.connect('example.com');

socket.on('message', function(message) {
	console.log(message);
});
socket.send({hello:'world'});
```

A main goal of json-sockets is to be simple, cross-domain, cross-browser and purely native js.  
To accomplish this the following transport methods are used:

`Web-sockets` Chrome, Safari, Safari Mobile (fallbacks to `CORS` on connection timeout)  
`CORS` Firefox 3.5+ [Crome, Safari]  
`Post-message + AJAX` Internet Explorer 8+, Opera  
`JSONP` Internet Explorer 7-  