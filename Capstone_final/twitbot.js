var Twit = require('twit');
var config = require('./config');
var api = require('./lib/api');
var natural = require('natural');

/* Change the config regard to your twitter accounts */
var conf = {
  consumer_key : 'vBlxlrx4BFnEzUGnLCap1chxq',
  consumer_secret : '6oVI1VLyAJujqbQO9Ms4Am6Nd52LtHuSXbctyR4sPHlvuxaFnX',
  access_token : '712639855633674240-5AzJjpJOyuj3LeUztBbhmlYvzmQ0pJ4',
  access_token_secret : 'FOkz4wO9ayUisiRdZAgzmNIHWNMRmdgGNNtn2FDvDeKph'
};

var T = new Twit(conf);
var classifier = buildClassifier();
console.log('The bot is running...');

var stream = T.stream('user');
stream.on('tweet', function(tweet) {
  if (tweet && tweet.text) {
    var words = tweet.text.toLowerCase();
    if (words.indexOf('thingplug') < 0) {
      return console.log('Not thingplug command, ignore it: '+tweet.text);
    }
    else {
      var cmdType = classifier.classify(words);
      console.log('cmdType :'+cmdType+' from msg:'+tweet.text);
      if (cmdType == 'get_temp') {
        postTweetTemperature();
      }
      if (cmdType == 'turn_on') {
        var cmd = JSON.stringify({'cmd':'on'});
        controlVirtualDevice(cmd);
      }
      if (cmdType == 'turn_off') {
        var cmd = JSON.stringify({'cmd':'off'});
        controlVirtualDevice(cmd);
      }
    }
  }
});

function postTweetTemperature() {
  api.getLatestContainer(config.nodeID, config.containerName, function(err,data){
    if(err) {
      console.log(err);
    }
    else{
      T.post('statuses/update', { status : 'Room Temperature:'+data.con }, function (err, data, response) {
      });
    }
  });
}

function controlVirtualDevice(cmd) {
  api.reqMgmtCmd(config.nodeID, config.mgmtCmdPrefix, cmd, function(err, data){
    var reply = {};
    if(err) {
      reply = { status : 'ThingPlug Error :'+err };
    }
    else {
      reply = { status : 'Send Control Message to Device:'+config.nodeID };
    }
    T.post('statuses/update', reply, function (err, data, response) {
    });
  });
}

function buildClassifier() {
  var classifier = new natural.BayesClassifier();
  classifier.addDocument(['get', 'temp', 'temperature'], 'get_temp');
  classifier.addDocument(['turn', 'on'], 'turn_on');
  classifier.addDocument(['turn', 'off'], 'turn_off');
  classifier.train();
  return classifier;
}
