(function () {
'use strict';

angular.module('daApp')
.controller('SpeakerInfoController', SpeakerInfoController);

SpeakerInfoController.$inject = ['$http', '$location', '$rootScope', '$scope', 'dataService', 'logger', 'localDbMiscService', 'utilityService'];

function SpeakerInfoController($http, $location, $rootScope, $scope, dataService, logger, localDbMiscService, utilityService) {
  var sinfoCtrl = this;
  var util = utilityService;
  var dbService = localDbMiscService;
  
  sinfoCtrl.submit = submit;
  $scope.msg = '';

  var speakerName = dataService.get('speakerName'); // speakerName should be set from start.html
  if (!speakerName || speakerName === '') {
    logger.error('No speaker name. Setting default.');
    speakerName = util.getConstant('defaultSpeakerName');
  }

  var PATHTOSPEAKERINFOFORMAT = 'speaker-info-format.json';
  $scope.attributes = [];
  $http.get(PATHTOSPEAKERINFOFORMAT).then(
    function success(infoFormat) {
      $scope.attributes = infoFormat.data;

      $rootScope.isLoaded = true;
    },
    function error(response) {
      $scope.msg = 'Error rendering page.';

      logger.error(response);
    }
  );

  //////////

  function submit() {
    // set info used by recording
    var speakerInfo = {};
    for (var i = 0; i < $scope.attributes.length; i++) {
      var attr = $scope.attributes[i].attribute;
      // populate speakerInfo object with keys as attribute
      //   and values as the entered values from the template
      speakerInfo[attr] = sinfoCtrl[attr] || '';
    }
    speakerInfo.name = speakerName;
    dataService.set('speakerInfo', speakerInfo); // set in ram

    // set user in local db async
    dbService.setSpeaker(speakerName, speakerInfo).then(
      function success(info){
        // on success, set the info in dataservice, with now updated speakerInfo['deviceImei']
        if (info) dataService.set('speakerInfo', info);
      },
      function error(value) {
        logger.error( 'Failed setting speaker in local db, speakerName: ' + speakerName + 
                      ', speakerInfo: ' + JSON.stringify(speakerInfo) + ', with error: ' + value);
      }
    );

    $location.path('/recording');
  }
}
}());
