app.controller("userController", ["$rootScope","$scope", "$resource", "$state", "$stateParams", "userManager", "resultHandler", "notifications", function($rootScope, $scope, $resource, $state, $stateParams, userManager, resultHandler, notifications){
  var User = $resource("api/userprofile/:userId", {userId: "@userId"});
  var UserRoles = $resource("api/userrole/:roleId", {roleId: "@roleId"});
  var Project = $resource("api/project/:projectId", {projectId: "@projectId"});
  var Blog = $resource("api/blog/:blogId", {projectId: "@blogId"});
  var ChangePassword = $resource("auth/change");

  $scope.query = {};
  $scope.projectCount = 0;

  $scope.userLoading = true;
  $scope.userManager = userManager;
  var defaultSelection = [];

  UserRoles.get({}, function(result){
    if(resultHandler.process(result)){
      $scope.roles = result.data;
      $scope.roleInfo = result;
      
      delete $scope.roleInfo["data"];      
    }
  });

  if($stateParams.userId){
    $scope.query.userId = $stateParams.userId;
    Project.get({projectId:'count', userid: $stateParams.userId}, function(result){
      if(resultHandler.process(result)){
        $scope.projectCount = result.count;
      }
    });
    Blog.get({blogId:'count', userid: $stateParams.userId}, function(result){
      if(resultHandler.process(result)){
        $scope.blogCount = result.count;
      }
    });
  }

  $scope.changePassword = function(){
    ChangePassword.save({
      oldPassword: $scope.oldpassword,
      password: $scope.password
    }, function(result){
      if(resultHandler.process(result)){
        $scope.oldpassword = "";
        $scope.password = "";
        $scope.confirm = "";
        notifications.notify("Your password was successfully changed. ", null, {sentiment: 'positive'});
      }
      else{
        notifications.notify(result.errText, null, {sentiment: 'negative'});
      }
    });
  };

  $scope.getUserData = function(query, append){
    User.get(query, function(result){
      $scope.userLoading = false;
      if(resultHandler.process(result)){
        if(append && append==true){
          $scope.users = $scope.users.concat(result.data);
        }
        else{
          $scope.users = result.data;
        }
        $scope.userInfo = result;
        console.log(result.data);
        $rootScope.headTitle = result.data[0].username + " : Qlik Branch Users";
        $rootScope.metaKeys = "Branch, Qlik Branch, Qlik Sense, Qlik, Open Source, Github, Projects, Extensions, Mash-ups, API, QAP, Qlik Analytics Platform";
        $rootScope.metaDesc = "Qlik Branch integrates with Github to host open source projects leveraging Qlik's extensibility and APIs.  Find code to use as a foundation for your next project, share your work, or get inspired."
        $rootScope.metaImage = "http://" + location.host + "/resources/branch_logo.png";
        
        //$scope.setTab(0);
        delete $scope.userInfo["data"];
      }
    });
  };

  $scope.activeTab = 0;
  $scope.firstLoad = true;

  $scope.setTab = function(index){
    $scope.activeTab = index;
    if(!$scope.firstLoad){
      searchExchange.clear();
    }
  };

  $scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){
    if(fromState.name.split(".")[0]==toState.name.split(".")[0]){ //then we should clear the search state
       if(toState.name.split(".").length==1){ //we only need to do this if we're on a listing page
        searchExchange.publish("executeSearch");
       }
    }
    if(toState.name!="loginsignup"){
      searchExchange.view = toState.name.split(".")[0];
    }
    if((fromState.name.split(".")[0]!=toState.name.split(".")[0]) || fromState.name=="loginsignup"){
      searchExchange.clear(true);
    }
    defaultSelection = [];
    if(toState.name=="users" || toState.name=="users.detail"){
      userManager.refresh(function(hasUser){
        if(!hasUser){
          defaultSelection.push({
            field: "approved",
            values: [{qText: "True"}]
          });
        }
        else{
          if(!userManager.canApprove('project') && userManager.userInfo._id!=$stateParams.userId){
            defaultSelection.push({
              field: "approved",
              values: [{qText: "True"}]
            });
          }
        }
        defaultSelection.push({
          field: "userId",
          values: [{qText: $stateParams.userId}]
        });
        searchExchange.subscribe('reset', "users", function(){
          searchExchange.init(defaultSelection);
          searchExchange.unsubscribe('reset', "users");
        });
        $scope.firstLoad = false;
      });
      $scope.getUserData($scope.query);
    }
    else if(toState.name=="users.addedit" || toState.name=="userprofiles.addedit"){
      //need to implement edit stuff
      userManager.refresh(function(hasUser){
        if(!hasUser){
          window.location = "#!login?url=user/"+$stateParams.userId+"/edit"
        }
        else{
          if($stateParams.userId!="new"){
            $scope.getUserData($scope.query);
          }
        }
      });
    }
    else{
      //shouldn't reach here

    }
  });

  $scope.previewThumbnail = function(){
    $scope.dirtyThumbnail = true;
    var file = $("#userImage")[0].files[0];
    var imageName = file.name;
    var imageType = file.type;
    var r = new FileReader();
    r.onloadend = function(event){
      var imageCanvas = document.createElement('canvas');
      var imageContext = imageCanvas.getContext('2d');
      var thumbnailCanvas = document.createElement('canvas');
      var thumbnailContext = thumbnailCanvas.getContext('2d');
      var thumbnail = new Image();
      thumbnail.onload = function() {
        var width = thumbnail.width;
        var height = thumbnail.height;
        imageCanvas.width = width;
        imageCanvas.height = height;
        thumbnailCanvas.width = (width * (77/height));
        thumbnailCanvas.height = 77;

        //draw the image and save the blob
        imageContext.drawImage(thumbnail, 0, 0, imageCanvas.width, imageCanvas.height);
        $scope.image = {
          type: imageType,
          name: imageName,
          data: imageCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "")
        }

        //draw the thumbnail and save the blob
        thumbnailContext.drawImage(thumbnail, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        $scope.thumbnail = {
          type: imageType,
          name: imageName,
          data: thumbnailCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "")
        }
        $scope.$apply(function(){
          $scope.users[0].thumbnail = thumbnailCanvas.toDataURL();
        });
      };
      thumbnail.src = r.result;
    }
    r.readAsDataURL(file);
  };

  $scope.validateNewUserData = function(){
    //We're validating client side so that we don't keep passing image data back and forth
    //Some of these errors shouldnt occur becuase of the html5 'required' attribute but just in case...
    var errors = [];
    //Verify the project has a name
    if(!$scope.users[0].fullname || $scope.users[0].fullname==""){
      errors.push("Please tell us your name");
    }
    //If there are errors we need to notify the user
    if(errors.length > 0){
      //show the errors
      notifications.notify("The user could not be saved. Please review the following...", errors, {sentiment: "warning"});
      window.scrollTo(100,0);
    }
    else{
      //Save the record
      $scope.saveUser();
    }
  };

  $scope.saveUser = function(){
    $scope.userLoading = true;
    var data = {
      standard: $scope.users[0]
    };
    if($scope.dirtyThumbnail){
      data.special = {
        image: $scope.image,
        thumbnail: $scope.thumbnail
      }
    }
    var query = {};
    if($scope.users[0]._id){
      query.userId = $scope.users[0]._id;
    }
    User.save(query, data, function(result){
      $scope.userLoading = false;
      if(resultHandler.process(result)){
        var status = $scope.isNew ? "created" : "updated";
        window.location = "#!user/"+result._id+"?status="+status;
      }
      else{
        notifications.notify(result.errText, null, {sentiment: "negative"});
      }
    });
  };

}]);
