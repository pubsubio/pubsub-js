var pubsub = require('../index').connect('localhost:9999');

pubsub.subscribe({}, function(doc) {
	console.log(doc);
});

pubsub.publish({hello:'world'});
