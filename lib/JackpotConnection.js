var net = require('net');

var JACKPOT_PORT = 777;
var STREAM_SEPARATOR = '\r\n';

var JackpotConnection = function(node, streaming){
  this.streaming = streaming || false;
  this.socket = net.connect(JACKPOT_PORT, node);
}

JackpotConnection.prototype.setRequest = function(type, data){
  this.request = data || {};
  this.request.requestType = type;
}

JackpotConnection.prototype.setCallback = function(callback){
  var dataString = "";
  this.socket.on('data', function(data){
    dataString += data;
    if (this.streaming){
      var endIndex, jsonString;
      while ((endIndex = dataString.indexOf(STREAM_SEPARATOR)) > -1){
        jsonString = dataString.slice(0, endIndex);
        dataString = dataString.slice(endIndex + STREAM_SEPARATOR.length);
        callback(JSON.parse(jsonString));
      }
    }
  });
  this.socket.on('end', function(){
    if (this.streaming){
      var jsonStrings = dataString.split(STREAM_SEPARATOR);
      for (var i = 0; i < jsonStrings.length; i++){
        callback(JSON.parse(jsonStrings[i]));
      }
    } else {
      callback(JSON.parse(dataString));
    }
  });
}

JackpotConnection.prototype.execute = function(callback){
  if (this.request){
    if (callback) this.setCallback(callback);
    this.socket.write(JSON.stringify(this.request));
  }
}

module.exports = JackpotConnection;