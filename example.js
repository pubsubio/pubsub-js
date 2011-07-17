var pubsub = require('./pubsub.io').connect('localhost:10547');

//datetime
/*
pubsub.subscribe({time:{$datetime:'Wednesday 2010'}},function(doc) {
	console.log(doc);
});

var tick = function() {
	pubsub.publish({time:new Date()});
};

setInterval(tick,1000);
*/
//select
/*
pubsub.subscribe({id:0,username:'ian'},{username:1,age:1},function(doc) {
	console.log(JSON.stringify(doc));
});	

pubsub.publish({id:0,username:'ian',age:27});
*/


//distance
/*
//berlin
pubsub.subscribe({bla: {$distance: {center: {lon: 52.523, lat: 13.412}, radius:'800 km'}}}, function(doc) {
	console.log(JSON.stringify(doc.bla) + ' is within the given radius of Berlin');
});

//oslo
pubsub.publish({bla:{lon: 59.914,lat: 10.752}});
*/
/*
pubsub.subscribe({id:{$gt:10}}, function(doc) {
	console.log(JSON.stringify(doc));
});

pubsub.publish({id:10});
pubsub.publish({hello:'eOrld'});
*/