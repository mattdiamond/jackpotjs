require('./JackpotConnection.js');

var JackpotQuery = function(query, callback){
  this.query = query;
  this.results = [];
  this.callback = callback;
  this.exclude = [];
}

JackpotQuery.prototype.setExclude = function(exclude){
  this.exclude = exclude;
}

JackpotQuery.prototype.execute = function(){
  for (var node in nodeList){
    if (nodeList.hasOwnProperty(node) && this.exclude.indexOf(node) === -1){
      var conn = new JackpotConnection(node, true);
      conn.setRequest(JackpotRequest.SEARCH, { query: this.query, exclude: this.exclude });
      conn.execute(function(result){
        this.results.push(result);
        this.callback(result);
      });
    }
  }
}

module.exports = JackpotQuery;