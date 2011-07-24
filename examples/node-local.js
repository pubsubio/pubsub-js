var pubsub = require('../index').connect();

pubsub.subscribe({}, function(doc) {
	console.log(doc);
});

pubsub.publish({hello:'world'});