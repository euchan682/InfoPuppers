var http = require('http'),
    querystring = require('querystring'),
    stream = require('stream');

var chain = null;

exports.setUp = function(currentchain){
  chain = currentchain;
}

exports.constructDataStream = function(dogname){
  var interm = new stream.PassThrough();
  var data = {};
  var ind1 = findFirstPiece(dogname);
  var totalOut = 0;
  if(ind1==-1){
    setTimeout(()=>{
      interm.end()
    }, 500);
  }
  while(ind1>=0){
    totalOut++;
    var block = chain[ind1];
    var options = {
      host: block.contactip.split(':')[0],
      port: block.contactip.split(':')[1],
      path: '/getinfo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    var req = http.request(options, (res)=>{
      var total = "";
      res.on('data', (chunk)=>{
        total+=chunk;
      });
      res.on('end', ()=>{
        var temp = JSON.parse(total);
        temp.forEach((result)=>{
          data[result.key] = result.data;
        });
        totalOut--;
        if(totalOut==0){
          interm.write(JSON.stringify(data));
          interm.end();
        }
      });
    });
    req.write(querystring.stringify({dogname}));
    req.end();
    ind1 = block.previousIndex;
  }
  return interm;
}

function findFirstPiece(dogname){
  for(var i = chain.length-1; i>=0; i--){
    if(chain[i].dogname == dogname){
      return i;
    }
  }
  return -1;
}