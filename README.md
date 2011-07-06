# Pubsub.io JS client
**a query based client/server publish subscribe protocol built on node.js.**

Client implementions for the browser and node.js.

```js
// to connect in node.js do:
var pubsub = require('pubsub').connect('www.pubsub.io');

// to connect in the browser do:
var pubsub = pubsub.connect('www.pubsub.io');

pubsub.subscribe({}, function(doc) {
	console.log('someone published', doc);
});

pubsub.publish({foo:'bar'});
```

# LICENSE

Most Pubsub.io source files are made available under the terms of the
GNU Affero General Public License (AGPL).  See individual files for
details.