# node-jsondb-client

Socket client for use with [node-jsondb-srv](https://github.com/mcmlxxix/node-jsondb-srv)

## Description

[node-jsondb-client](https://github.com/mcmlxxix/node-jsondb-client) is a socket client for use with [node-jsondb-srv](https://github.com/mcmlxxix/node-jsondb-srv). The JSON database socket service accepts connections from the client and allows interaction with a remote JSON database.

## Installation

npm install node-jsondb-client

## Usage

var dbName = "test";
var dbHost = "localhost";
var dbPort = 10089;

var jsonClient = require('node-jsondb-client').create(dbName,dbHost,dbPort);

jsonClient.connect();

var userName = "admin";
var userPass = "admin";

function callback(response) {
	console.log("packet received: " + JSON.stringify(response));
}

var path = "path/to/object";

jsonClient.auth(callback,userName,userPass);
jsonClient.lock(callback,path,"w");
jsonClient.read(callback,path);
jsonClient.write(callback,[{path:"path/to",key:"object",value:10},...]);
jsonClient.unlock(callback,path);

jsonClient.subscribe(callback,path);
jsonClient.unsubscribe(callback,path);

jsonClient.disconnect();




