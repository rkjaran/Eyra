/*
Copyright 2016 The Eyra Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

File author/s:
    Matthias Petursson <oldschool01123@gmail.com>
*/

"use strict";

describe('authentication service', function(){
  beforeEach(module('daApp'));
  
  // TODO mock the JWT token creation of Flask-JWT correctly and use $httpBackend to
  // mock /backend/auth/login to verify login/logout functionality
  var authenticationService;
  beforeEach(inject(function(_authenticationService_){
    authenticationService = _authenticationService_;
  }));

  it('should not be logged in', function(){
    expect(authenticationService.loggedIn()).toBeFalsy();
  });
});