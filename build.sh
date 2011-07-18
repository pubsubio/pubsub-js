echo "(function(module, exports) {" > pubsub.io.js
mud inline index.js >> pubsub.io.js
echo "}({browser:true}, window.pubsub = {}));" >> pubsub.io.js
