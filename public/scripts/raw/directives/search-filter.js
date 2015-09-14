app.directive("searchFilter", ["searchExchange", function(searchExchange){
  return {
    restrict: "E",
    replace: true,
    scope: {

    },
    link: function($scope, element, attr){
      $scope.title = attr.title;

      $scope.toggleValue =  function(elemNum){
        $scope.$parent.toggleSelect(attr.field, elemNum);
      }
      $scope.$on('searchResults', function(){
        if($scope.info){
          $scope.render();
        }
        else{
          $scope.postponed = function(){
            $scope.render();
          }
        }
      });
      $scope.$on("update", function(params){
        if($scope.info){
          $scope.render();
        }
        else{
          $scope.postponed = function(){
            $scope.render();
          }
        }
      });
      $scope.$on('cleared', function(){
        if($scope.info){
          $scope.render();
        }
        else{
          $scope.postponed = function(){
            $scope.render();
          }
        }
      });

      $scope.render = function(){
        $scope.info.object.getLayout().then(function(layout){
          $scope.info.object.getListObjectData("/qListObjectDef", [{qTop:0, qLeft:0, qHeight:layout.qListObject.qSize.qcy, qWidth: 1 }]).then(function(data){
            $scope.$apply(function(){              
              $scope.info.items = data[0].qMatrix;
            });
          });
        });
      };

      $scope.selectValue = function(value){
        $scope.info.object.selectListObjectValues("/qListObjectDef", [value], true).then(function(){
          searchExchange.render();
        });
      };

      searchExchange.addFilter({
          id: $(element).attr("id"),
          field: attr.field
        }, function(result){
        $scope.$apply(function(){
          $scope.info = result;
          if($scope.postponed){
            $scope.postponed.call(null);
          }
          else{
            $scope.render();
          }

        });
      });

    },
    templateUrl: "/views/search/search-filter.html"
  }
}])
