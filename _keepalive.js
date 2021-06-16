const settings = require('settings-store');

require('./globals.js');

PHPSESSID = settings.value("Profile.session_token");

process.on('message', async(message) => {
    let msg = message;
    console.log("Process received message: " + msg);

    keepalive();
})

async function initialize(){
	setTimeout(() => {
		keepalive();
	}, 60000);
}

async function keepalive() {
	console.log("Sending keep-alive!");
	let path = "/client/game/keepalive";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];

				console.log(body);

				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}

				initialize();
	});
	await util.sleep(150);
}

/* **** SENDER FUNCTION **** */
function send_request(url, _port = 443, path, data, type = "POST"){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: type,
		  headers: {
			  'User-Agent':			settings.value("GameConstants.UnityPlayerVersion"),
			  'Content-Type': 		'application/json',
			  'Accept': 			'application/json',
			  'App-Version': 		settings.value("GameConstants.AppVersion"),
			  'GClient-RequestId': 	15,
			  'X-Unity-Version':    settings.value("GameConstants.XUnityVersion")
		  } 
		};
		//console.log(options);
		if(PHPSESSID !== ''){ // assign phpsessid only once
			options['headers']['Cookie'] = "PHPSESSID=" + settings.value("Profile.session_token");
		}
		integer++; // add integer number to request counting requests and also making their stupid RequestId Counter
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				//if(typeof res.headers['set-cookie'][1] != "undefined")
					//PHPSESSID = settings.get("Profile.session_token");//res.headers['set-cookie'][1].replace("PHPSESSID=","").replace("; path=/",""); // properly grab PHPSESSID from server
				//console.log("["+integer+"][URL]> " + path + " [StatusCode]" + res.statusCode);
				if(res.statusCode != 200){ 
					reject("No Response: " + res.statusCode);
				}
				let chunks = [];
				res.on('data', (d) => {
					chunks.push(d);
				});
				res.on('end', function(){
					resolve(Buffer.concat(chunks));
				});
			});
			// return error if error on request
			req.on('error', err => {
				reject(err); 
			});
			req.write(buffer);
			req.end();
		});
	});
}

module.exports.initialize = initialize;
module.exports.keepalive = keepalive;