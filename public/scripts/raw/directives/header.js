app.directive('header', ['userManager', '$state', '$interpolate', function (userManager, $state, $interpolate) {
  return {
    restrict: "A",
    replace: true,
    scope:{

    },
    templateUrl: "/views/header.html",
    link: function(scope){
      scope.userManager = userManager;
      scope.breadcrumbs;
      scope.$on('$stateChangeSuccess', function() {
        scope.activeItem = $state.current.name.split(".")[0];
        scope.breadcrumbs = [];
        var state = $state.$current;
        if(state.self.name != "home"){
          while(state.self.name != ""){
            scope.breadcrumbs.push({
              text: state.data.crumb,
              link: state.data.link
            });
            state = state.parent;
          }
          scope.breadcrumbs.push({text: "Home", link: "/"});
        }
        scope.breadcrumbs.reverse();
      });
      scope.$on('spliceCrumb', function(event, crumb){
        scope.breadcrumbs.splice(-1, 1, crumb);
      });
      scope.$on('addCrumb', function(event, crumb){
        scope.breadcrumbs.push(crumb);
      });
      scope.getLoginUrl = function(){
        var suffix = "";
        if($state.$current.name!="home"){
          suffix += "?url=";
        }
        if(window.location.hash.indexOf('login')==-1 && window.location.hash.indexOf('reset')==-1){
          suffix += window.location.hash.replace("#/","");
        }
        return "#loginsignup"+suffix;
      }
    }
  }
}]);
