/*var val = '12 +2';

//console.log('11:'.match(/(\d{1,2})(?!:)/));
console.log('mond 10 aug 11:00:--'.match(/(\d{1,2})(?:[^:0-9]|$)?/).slice(1));

var template = /^(?:(mon|tue|wed|thu|fri|sat|sun)\w*)?,?\s*(\d{1,2}(?:[^:0-9]|$))?\s*([a-z]+)?\s*(\d{4})?\s*([\d|-]{1,2}:[\d|-]{1,2}:[\d|-]{1,2})?\s*([+-]\d*\.?\d+)?/i;
var matches = val.match(template);
console.log(matches.slice(1));
*/
var pubsub = require('./pubsub.io').connect('localhost:10547');

pubsub.subscribe({time:{$datetime:'02:00:-- +2'}},function(doc) {
	console.log(doc);
});

var tick = function() {
	pubsub.publish({time:new Date().toString()});
};

setInterval(tick,1000);