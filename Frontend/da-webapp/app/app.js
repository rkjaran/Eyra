// **************************************************************************************** //

//                                         TODO                                             //

// sanitize user input for speakerId, etc.
// add try catch, for example with JSON.stringify

// ***************************************************************************************** //

'use strict';

var putOnline = false;
var BACKENDURL = putOnline ? 'bakendi.localtunnel.me' : '127.0.0.1:5000';

var app = angular.module('daApp', ['LocalForageModule']);

// make sure Angular doesn't prepend "unsafe:" to the blob: url
app.config( [
      '$compileProvider',
      function( $compileProvider )
      {   
          $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|blob):/);
      }
]);

// fix some angular issue with <audio ng-src="{{var}}"></audio>
app.filter("trustUrl", ['$sce', function ($sce) {
  return function (recordingUrl) {
    return $sce.trustAsResourceUrl(recordingUrl);
  };
}]);

app.controller('RecordingController', function($scope, $http, $localForage) {
  var recordCtrl = this;

  $scope.msg = ''; // single debug/information msg
  $scope.msg2 = '';
  $scope.recordings = []; // recordings so far

  // these button things don't work yet
  $scope.recordBtnDisabled = false;
  $scope.stopBtnDisabled = true;
  $scope.saveBtnDisabled = true;

  var start_time = new Date().toISOString();
  var end_time;

  var audio_context;
  var recorder;
  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');
    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //console.log('Input connected to audio context destination.');
    
    recorder = new Recorder(input);
    console.log('Recorder initialised.');
  }

  // controller functions
  recordCtrl.record = function() {
    recorder && recorder.record();
    $scope.msg = 'Recording now...';

    $scope.recordBtnDisabled = true;
    $scope.stopBtnDisabled = false;
    $scope.saveBtnDisabled = true;
    console.log('Recording...');
  };

  recordCtrl.stop = function() {
    $scope.msg = 'Processing wav...';

    recorder && recorder.stop();
    $scope.stopBtnDisabled = true;
    $scope.recordBtnDisabled = false;
    $scope.saveBtnDisabled = false;
    console.log('Stopped recording.');
    
    // create WAV download link using audio data blob and display on website
    createWav();
    
    recorder.clear();
  };

  recordCtrl.save = function() {
    $scope.msg = 'Saving and sending recs...';

    $scope.saveBtnDisabled = true;
    
    // these scope variables connected to user input obviously have to be sanitized.
    end_time = new Date().toISOString();
    var jsonData =  {                                                                  
                      "type":'session', 
                      "data":
                      {
                         "speakerId"      : ($scope.speakerId || 1),
                         "instructorId"   : ($scope.instructorId || 1),
                         "deviceId"       : ($scope.deviceId || 1),
                         "location"       : ($scope.curLocation || 'unknown'),
                         "start"          : start_time,
                         "end"            : end_time,
                         "comments"       : ($scope.comments || 'no comments'),
                         "recordingsInfo" : {}
                      }
                    };
    // update start time for next session
    start_time = new Date().toISOString();

    // and send it to remote server
    // test CORS is working
    $http({
      method: 'GET',
      url: 'http://'+BACKENDURL+'/submit/session'
    })
    .success(function (data) {
      console.log(data);
    })
    .error(function (data, status) {
      console.log(data);
      console.log(status);
    });

    // send our recording/s, and metadata as json
    var fd = new FormData();
    for (var i = 0; i < $scope.recordings.length; i++)
    {
      var rec = $scope.recordings[i];
      fd.append('rec'+i, rec.blob, rec.title);
      // all recordings get same tokenId for now
      jsonData["data"]["recordingsInfo"][rec.title] = { "tokenId" : 5 };
    }
    fd.append('json', JSON.stringify(jsonData));

    $http.post('http://'+BACKENDURL+'/submit/session', fd, {
      // this is so angular sets the correct headers/info itself
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined}
    })
    .success(function (data) {
      console.log(data);
    })
    .error(function (data, status) {
      console.log(data);
      console.log(status);
    });
  };

  function createWav() {
    recorder && recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);

      // display recordings on website
      $scope.recordings.push({"blob":blob,
                              "url":url,
                              "title":(new Date().toISOString() + '.wav')});
      $scope.saveBtnDisabled = false;

      $scope.$apply(); // update our bindings
    });
  }

  // kick it off
  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia =  navigator.getUserMedia || navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    
    audio_context = new AudioContext;
    console.log('Audio context set up.');
    console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
  } catch (e) {
    alert('No web audio support in this browser!');
  }
  
  navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
    console.log('No live audio input: ' + e);
  });
});



