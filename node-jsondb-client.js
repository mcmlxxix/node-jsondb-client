var net, fs, tx, constants, err, oper, lock, crypto;

function JSONClient(db,host,port) {
	this.db = db;
	this.host = host;
	this.port = port;
	
	/* request counter */
	this.counter = 0;
	
	/* client socket */
	this.socket;
	
	/* callback storage */
	this.callback = {};
}

JSONClient.prototype.connect = function() {
	this.socket = connect.call(this);
}
JSONClient.prototype.disconnect = function() {
	disconnect.call(this);
}
JSONClient.prototype.auth = function(callback,user,pass) {
	var request = auth.call(this,user,pass);
	handleRequest.call(this,callback,request,false);
}
JSONClient.prototype.lock = function(callback,path,lockType) {
	var request = lockTransaction.call(this,path,lockType);
	handleRequest.call(this,callback,request,false);
}
JSONClient.prototype.unlock = function(callback,path) {
	var request = unlockTransaction.call(this,path);
	handleRequest.call(this,callback,request,false);
};
JSONClient.prototype.read = function(callback,path) {
	var request = read.call(this,path);
	handleRequest.call(this,callback,request,false);
};
JSONClient.prototype.write = function(callback,path,data) {
	var request = write.call(this,path,data);
	handleRequest.call(this,callback,request,false);
};
JSONClient.prototype.subscribe = function(callback,path) {
	var request = subscribe.call(this,path);
	handleRequest.call(this,callback,request,true);
};
JSONClient.prototype.unsubscribe = function(callback,path) {
	var request = unsubscribe.call(this,path);
	handleRequest.call(this,callback,request,true);
};
JSONClient.prototype.request = function(callback,oper,data) {
	var request = new Request(oper,this.db,data);
	handleRequest.call(this,callback,request,false);
}

/* query object */
function Request(oper,db,data,lock) {
	this.oper = oper;
	this.db = db;
	this.data = data;
	this.lock = lock;
}

/* request handler */
function handleRequest(callback,request,persist) {
	request.qid = this.counter++;
	this.callback[request.qid] = {func:callback,persist:persist};
	output(this.socket,request);
}
function handleCallback(request) {
	if(request.qid == null || this.callback[request.qid] == null) 
		return null;
	if(typeof this.callback[request.qid].func == "function")
		this.callback[request.qid].func(request);
	if(this.callback[request.qid].persist == false)
		delete this.callback[request.qid];
}

/* events */
function onConnect(socket) {
}
function onClose() {
	this.socket.rl.close();
}
function onError(e) {
	log(e);
}
function onReceive(str) {
	var request = tx.decode(JSON.parse(str));
	handleCallback.call(this,request);
	return request;
}

/* socket functions */
function output(socket,request) {
	request = JSON.stringify(tx.encode(request));
	socket.write(request + "\r\n");
	return request;
}
function connect() {
	var s = new net.Socket();
	s.setEncoding('utf8');
	s.ip = s.remoteAddress;
	s.rl = rl.createInterface({
		input:s,
		output:s
	});
	s.rl.on('line',(s)=>onReceive.call(this,s));
	s.on("close",()=>onClose.call(this));
	s.on("error",(e)=>onError.call(this,e));
	s.on('connect',()=>onConnect.call(this));
	return s.connect(this.port,this.host);
}
function disconnect() {
	this.socket.end();
}

/* db functions */
function auth(user,pass) {
	var hash = crypto.createHash('md5').update(pass).digest('hex');
	return new Request(oper.AUTH,this.db,{name:user,pass:hash});
}
function lockTransaction(path,lockType) {
	return new Request(oper.LOCK,this.db,[{path:path}],lockType);
}
function unlockTransaction(path) {
	return new Request(oper.UNLOCK,this.db,[{path:path}]);
}
function read(path) {
	return new Request(oper.READ,this.db,[{path:path}]);
}
function write(path,data) {
	return new Request(oper.WRITE,this.db,data);
}
function subscribe(path) {
	return new Request(oper.SUBSCRIBE,this.db,[{path:path}]);
}
function unsubscribe(path) {
	return new Request(oper.UNSUBSCRIBE,this.db,[{path:path}]);
}

/* initialization */
function init() {
	constants = require('./lib/constant');
	tx = require('./lib/transform');
	net = require('net');
	rl = require('readline');	
	crypto = require('crypto');

	err = constants.error;
	oper = constants.oper;
	lock = constants.lock;
}

/* goooooo */
init();

/* module methods */
module.exports.create = function(db,host,port) {
	return new JSONClient(db,host,port);
}