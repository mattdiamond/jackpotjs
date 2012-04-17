/*
  JackpotJS v0.0.1-alpha
  */

var _           = require('underscore'),
    net         = require('net'),
    fs          = require('fs'),
    path        = require('path'),
    GUIServer   = require('http').createServer(HTTPHandler),
    static      = require('node-static');

var JackpotConnection = require('./lib/JackpotConnection.js');
var JackpotQuery      = require('./lib/JackpotQuery.js');

// ************ GUI Server *****************

var staticFile = new (static.Server)('./GUI');
GUIServer.listen(80, "127.0.0.1");

function HTTPHandler(req, res){
  req.on('end', function(){
    staticFile.serve(req, res);
  });
}

// $$$$$$$$$$$$$ JackpotCore $$$$$$$$$$$$$$

//list of all known nodes
var nodeList = [];

//this server's shared directories
var shared = [];

var JackpotRequest = {
  NODELIST : 0,
  FILE : 1,
  SEARCH : 2
};

var JACKPOT_PORT = 777;

//listen on port 777 for nodelist and file requests

net.createServer(function(c){
  readJSON(c, function(obj){
    switch(obj.requestType){
      case JackpotRequest.NODELIST:
        handleNodeListRequest(c);
        break;
      case JackpotRequest.FILE:
        sendFile(c, obj.path);
        break;
      case JackpotRequest.SEARCH:
        handleSearchRequest(c, obj);
        break;
    }
  });
}).listen(JACKPOT_PORT);

function handleNodeListRequest(socket){
  //send back your node list
  socket.end(JSON.stringify(nodeList));
  //add requestor to node list if not already present
  nodeList[socket.remoteAddress] = true;
}

function sendFile(socket, filepath){
  var directory = path.dirname(filepath);
  if (shared.indexOf(directory) == -1){
    //no way, buddy.
    socket.end();
    return false;
  }
  //set up file --> socket pipe
  var readStream = fs.createReadStream(filepath);
  readStream.pipe(socket);
}

function requestNodeList(host){
  var conn = new JackpotConnection(host);
  conn.setRequest(JackpotRequest.NODELIST);
  conn.setCallback(function(newNodes){
    nodeList = _.union(nodeList, newNodes);
  });
  conn.execute();
}

function requestFile(host, path, dest){
  var request = {
    type: request.FILE,
    path: path
  };
  var client = net.connect(JACKPOT_PORT, host, function(){
    //set up socket --> file pipe
    var writeStream = fs.createWriteStream(dest);
    client.pipe(writeStream);
    //send the request
    client.end(JSON.stringify(request));
  });
}

function handleSearchRequest(socket, search_obj){
  //search yourself
  var result = searchSelf(query);
  if (result){
    socket.write(JSON.stringify(result));
    socket.write(STREAM_SEPARATOR);
  }
  //search everyone else
  var JPQuery = new JackpotQuery(search_obj.query, function(result){
    socket.write(JSON.stringify(result));
    socket.write(STREAM_SEPARATOR);
  });
  //don't search the guy you got the request from, duh.
  search_obj.exclude.push(socket.remoteAddress);
  JPQuery.setExclude(search_obj.exclude);
  //do it.
  JPQuery.execute();
}