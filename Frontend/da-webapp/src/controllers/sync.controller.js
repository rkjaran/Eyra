/*
Copyright 2016 Matthias Petursson
Apache 2.0
*/

(function () {
'use strict';

angular.module('daApp')
.controller('SyncController', SyncController);

SyncController.$inject = ['$rootScope', 
                          '$scope', 
                          'dataService',
                          'deliveryService', 
                          'localDbMiscService', 
                          'logger', 
                          'tokenService', 
                          'utilityService'];

function SyncController($rootScope, $scope, dataService, deliveryService, localDbMiscService, logger, tokenService, utilityService) {
  var syncCtrl = this;
  var dbService = localDbMiscService;
  var delService = deliveryService;
  var util = utilityService;
  
  syncCtrl.sync = sync;

  $rootScope.isLoaded = true;
  $scope.hide_recording = true;
  $scope.hide_sync = false;
  $scope.hide_wifi_msg = true;

  $scope.tokensRead = 0;
  $scope.recsDelivered = 0;
  $scope.recsSaved = 0;
  $scope.tokensDownloaded = 0;

  activate();
  
  //////////

  function activate() {
    // TODO move this token logic to a service, as well as logic in rec controller

    // get tokensRead
    var speakerInfo = dataService.get('speakerInfo');
    if (speakerInfo) {
      var tokensRead = speakerInfo.tokensRead;
      if (!tokensRead) {
        // get from ldb
        dbService.getSpeaker(dataService.get('speakerName')).then(function(speaker){
          if (speaker) {
            tokensRead = speaker.tokensRead;
            $scope.tokensRead = tokensRead || $scope.tokensRead;
          }
        },
        util.stdErrCallback);
      } else {
        $scope.tokensRead = tokensRead;
      }
    }

    // get recsDelivered
    var recsDelivered = dataService.get('recsDelivered');
    if (!recsDelivered) {
      var speaker = dataService.get('speakerName');
      if (speaker) {
        dbService.getSpeaker(speaker).then(function(speaker){
          if (speaker) {
            $scope.recsDelivered = speaker.recsDelivered || $scope.recsDelivered;
          }
        },
        util.stdErrCallback);
      }
    } else {
      $scope.recsDelivered = recsDelivered;
    }

    // get tokens saved locally, changes $scope.recsSaved
    updateRecsSaved();

    // get count of tokens downloaded (on phone in ldb)
    tokenService.countAvailableTokens().then(function(count){
      $scope.tokensDownloaded = count || $scope.tokensDownloaded;
    },
    util.stdErrCallback);
  }

  function updateRecsSaved() {
    dbService.getRecsSaved().then(
      function success(count) {
        $scope.recsSaved = count || $scope.recsSaved || 0;
      },
      function error(error) {
        $scope.recsSaved = $scope.recsSaved || 0;
        logger.error(error);
      }
    );    
  }

  // sends all available sessions from local db to server, one session at a time
  // assumes internet connection
  function sync() {
    $scope.hide_sync = true;

    $scope.msg = 'Syncing - please wait';

    delService.sendLocalSessions(syncDoneCallback, syncProgressCallback);
  }

  // result is true if sync completed successfully
  function syncDoneCallback(result) {
    $scope.msg = result ? 'Sync complete.' : 'Sync failed.';
    $scope.hide_sync = false;
    $scope.recsDelivered = dataService.get('recsDelivered') || $scope.recsDelivered || 0;
    updateRecsSaved();

    if (!result){
      $scope.wifi_msg = 'Please connect your device to the internet.';
      $scope.hide_recording = true;
      $scope.hide_wifi_msg = false;
    } else {
      // sync success
      if (dataService.get('speakerName'))
        $scope.hide_recording = false; // show back button if user set
      $scope.hide_wifi_msg = true;
    }
  }

  function syncProgressCallback(recsDelivered) {
    /*
      Called with updated number of recs actually delivered to server. (from delivery service)

      Updates this count and does another check for how many were removed from the local database (sent).
    */
    if (recsDelivered) {
      $scope.recsDelivered = Math.max($scope.recsDelivered, recsDelivered);      
    }
    updateRecsSaved();
  }
}
}());