app.directive("searchResults", ["$resource", "$state", "$stateParams", "searchExchange", "userManager", "resultHandler", "publisher", function($resource, $state, $stateParams, searchExchange, userManager, resultHandler, publisher){
  return {
    restrict: "E",
    replace: true,
    scope: {

    },
    controller: function($scope, $element, $attrs){
      $.ajax({type: "GET", dataType: "text", contentType: "application/json", url: '/configs/'+$attrs.config+'.json', success: function(json){
        $scope.config = JSON.parse(json);
        $scope.template = $scope.config.template;
        $scope.fields = $scope.config.fields;
        $scope.qFields;
        $scope.sortOptions = $scope.config.sorting;
        $scope.sort = $scope.sortOptions[$scope.config.defaultSort];
        var Entity;
        if($scope.config.entity){
          Entity = $resource("/api/" + $scope.config.entity + "/:id", {id: "@id"});
        }

        //add additional sorting for moderators and admins
        if(userManager.canApprove($scope.config.entity)){
          $scope.sortOptions["flagged"] = {
            "id": "flagged",
            "name": "Flagged",
            "order": -1,
            "field": "flagcount",
            "sortType": "qSortByNumeric"
          };
        }

        $scope.highlightText = function(text){
          if(searchExchange.state && searchExchange.state.searchText){
            var terms = searchExchange.state.searchText.split(" ");
            for (var i=0;i<terms.length;i++){
              text = text.replace(new RegExp(terms[i], "i"), "<span class='highlight"+i+"'>"+terms[i]+"</span>")
            }
            return text;
          }
          else{
            return text;
          }
        };

        $scope.loading = true;

        $scope.template;

        $scope.items = [];

        $scope.hidden = [];

        $scope.flagged = {};

        $scope.stars = new Array(5);

        $scope.postponed;

        $scope.pageTop = 0;
        $scope.pageBottom = $scope.config.pagesize;
        $scope.currentPage = 1;
        $scope.pages = [];

        $scope.broadcast = function(fnName, params){
          $scope.$root.$broadcast(fnName, params);
        };

        $scope.getHidden = function(){
          if(Entity){
            Entity.get({id: "hidden"}, {
              limit: 100  //if we have more than 100 hidden items we have some housekeeping to do
            }, function(result){
              if(resultHandler.process(result)){
                $scope.hidden = result.data;
              }
            });
          }
        };

        $scope.getFlagged = function(){
          if(Entity){
            Entity.get({id: "flagged"}, {
              limit: 100  //if we have more than 100 flagged items we have some housekeeping to do
            }, function(result){
              if(resultHandler.process(result)){
                //$scope.flagged = result.data;
                if(result.data){
                  for(var i=0;i<result.data.length;i++){
                    $scope.flagged[result.data[i].entityId] = true;
                  }
                }
              }
            });
          }
        };

        $scope.getHidden();
        $scope.getFlagged();

        $scope.isHidden = function(id){
          for(var i=0;i<$scope.hidden.length;i++){
            if($scope.hidden[i]._id == id){
              return true;
            }
          }
          return false;
        };

        $scope.isFlagged = function(id){
          if($scope.flagged){
            for(var i=0;i<$scope.flagged.length;i++){
              if($scope.flagged[i].entityId == id){
                return true;
              }
            }
            return false;
          }
          return false;
        };

        $scope.$root.$on('searching', function(){
          $scope.loading = true;
          $scope.pageTop = 0;
        });

        // searchExchange.subscribe("update", $attrs.id, function(){
        //   if(searchExchange.state && searchExchange.state.sort){
        //     $scope.sort = searchExchange.state.sort;
        //   }
        //   if(searchExchange.state && searchExchange.state.page){
        //     $scope.pageTop = ($scope.config.pagesize * searchExchange.state.page);
        //   }
        //   console.log('on update handle is '+$scope.handle);
        //   if($scope.handle){
        //     $scope.render();
        //   }
        //   else{
        //     $scope.postponed = function(){
        //       $scope.render();
        //     }
        //   }
        // });

        $scope.$root.$on("update", function(){
          if(searchExchange.state && searchExchange.state.sort){
            $scope.sort = searchExchange.state.sort;
          }
          if(searchExchange.state && searchExchange.state.page){
            $scope.pageTop = ($scope.config.pagesize * searchExchange.state.page);
          }
          console.log('on update handle is '+$scope.handle);
          if($scope.handle){
            $scope.render();
          }
          else{
            $scope.postponed = function(){
              $scope.render();
            }
          }
        });

        $scope.showItem = function(approved, entity){
          return approved=='True' || userManager.canApprove(entity);
        };

        $scope.changePage = function(direction){
          $scope.pageTop += ($scope.config.pagesize * direction);
          $scope.render();
        };

        $scope.setPage = function(pageNumber){
          searchExchange.setStateAttr("page", pageNumber);
          $scope.pageTop = ($scope.config.pagesize * pageNumber);
          $scope.render();
        }

        $scope.pageInRange = function(pageIndex){
					var minPage, maxPage;
					if($scope.pages.length==1){
						return false;
					}
					else if($scope.currentPage <= 2){
						minPage = 1;
						maxPage = 5
					}
					else if ($scope.currentPage >= $scope.pages.length - 2) {
						minPage = $scope.pages.length - 5;
						maxPage = $scope.pages.length;
					}
					else{
						minPage = $scope.currentPage - 2;
						maxPage = $scope.currentPage + 2;
					}
					return (pageIndex >= minPage && pageIndex <= maxPage);
				};

        $scope.render = function(){
          console.log('templater');
          console.log(Templater);
          console.log('result list handle is - '+$scope.handle);
          searchExchange.ask($scope.handle, "GetLayout", [], function(response){
            var layout = response.qLayout;
            $scope.qFields = layout.qHyperCube.qDimensionInfo.concat(layout.qHyperCube.qMeasureInfo);
            searchExchange.ask($scope.handle, "GetHyperCubeData", ["/qHyperCubeDef", [{qTop: $scope.pageTop, qLeft:0, qHeight: $scope.config.pagesize, qWidth: $scope.fields.length }]], function(response){
              var data = response.qDataPages;
              var items = [];
              $scope.$apply(function(){
                $scope.loading = false;
                $scope.terms
                $scope.pageTop = data[0].qArea.qTop;
                $scope.pageBottom = (data[0].qArea.qTop + data[0].qArea.qHeight);
                $scope.currentPage = Math.ceil($scope.pageBottom / $scope.config.pagesize);
                $scope.total = layout.qHyperCube.qSize.qcy;
                $scope.pages = [];
                for(var i=1;i<(Math.ceil($scope.total/$scope.config.pagesize)+1);i++){
                  $scope.pages.push(i);
                }
                //$scope.items = null;
                for(var i=0;i<data[0].qMatrix.length;i++){
                  var item = {}
                  //if the nullSuppressor field is null then we throw out the row
                  if($scope.config.nullSuppressor!=null && data[0].qMatrix[i][$scope.config.nullSuppressor].qText=="-"){
                    continue;
                  }
                  for (var j=0; j < data[0].qMatrix[i].length; j++){
                    item[$scope.qFields[j].qFallbackTitle] = data[0].qMatrix[i][j].qText;
                  }
                  items.push( item );
                }
                if(items.length==0){
                  $scope.renderEmpty();
                  return;
                }
                if(layout.qHyperCube.qSize.qcx < $scope.fields.length){
                  $scope.pageWidth();
                }
                $scope.qsItems = items
                $element.find(".result-list").html("Test");
                $scope.items = items;
                  //$scope.$apply();
              });
            });
          });
        };

        $scope.renderEmpty = function(){
          $scope.loading = false;
          $scope.items = [];
          //$scope.$apply();
        };

        $scope.pageWidth = function(){  //we currently only support paging width once (i.e. up to 20 fields)
          //$scope.info.object.getHyperCubeData("/qHyperCubeDef", [{qTop: $scope.pageTop, qLeft:10, qHeight: $scope.config.pagesize, qWidth: $scope.fields.length }]).then(function(data){
          searchExchange.ask($scope.handle, "GetLayout", [], function(response){
            var layout = response.qLayout;
            $scope.qFields = layout.qHyperCube.qDimensionInfo.concat(layout.qHyperCube.qMeasureInfo);
            searchExchange.ask($scope.handle, "GetHyperCubeData", ["/qHyperCubeDef", [{qTop: $scope.pageTop, qLeft:10, qHeight: $scope.config.pagesize, qWidth: $scope.fields.length }]], function(response){
              var data = response.qDataPages;
              $scope.$apply(function(){
                data[0].qMatrix.map(function(row, index){
                  var item = $scope.items[index];
                  for (var i=0; i < row.length; i++){
                    item[$scope.qFields[i].qFallbackTitle] = row[i].qText;
                  }
                  return item;
                });
              });
            });
          });
        };

        $scope.applySort = function(sort, render){
          searchExchange.setStateAttr("sort", sort);
          searchExchange.ask($scope.handle, "ApplyPatches", [[{
            qPath: "/qHyperCubeDef/qInterColumnSortOrder",
            qOp: "replace",
            qValue: getFieldIndex(sort.field)
          }], true], function(){
            if(render && render==true){
              $scope.render();
            }
          });
          // $scope.info.object.applyPatches([{
          //   qPath: "/qHyperCubeDef/qInterColumnSortOrder",
          //   qOp: "replace",
          //   qValue: getFieldIndex(sort.field)
          // }], true).then(function(result){
          //   $scope.render();
          // });
        };

        function getFieldIndex(field, asString){
          for (var i=0;i<$scope.fields.length;i++){
            if($scope.fields[i].dimension && $scope.fields[i].dimension==field){
              if(asString!=undefined && asString==false){
                return [i];
              }
              else {
                return "["+i+"]";
              }
            }
            else if ($scope.fields[i].label && $scope.fields[i].label==field) {
              if(asString!=undefined && asString==false){
                return [i];
              }
              else {
                return "["+i+"]";
              }
            }
          }
          return 0;
        }

        $scope.$root.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
          //if there is an existing state we should update the pageTop property on the scope
          //and apply patches to the object for sorting
          if(fromState.name.split(".")[0]==toState.name.split(".")[0]){ //then we should clear the search state
            if(toState.name.split(".").length==1){ //we only need to do this if we're on a listing page
              if(searchExchange.state && searchExchange.state.sort){
                $scope.applySort(searchExchange.state.sort);
              }
            }
          }
        });

        $scope.$root.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){
          if(toState.name.split(".").length==1){ //we only need to do this if we're on a listing page
            if(searchExchange.state){
              if(searchExchange.state.page || searchExchange.state.sort){
                searchExchange.render();
              }
            }
          }
        });

        searchExchange.addResults({
            id: $attrs.id,
            fields: $scope.fields,
            sortOptions: $scope.sortOptions,
            defaultSort: getFieldIndex($scope.sort.field, false)
          }, function(result){
            $scope.handle = result.handle;
            if(!$scope.template){
              $scope.template = new Templater($scope.config.template);
            }
            if($scope.postponed){
              console.log('execute postponed');
              $scope.postponed.call(null);
            }
            $scope.$apply();

          });

      }});
    },
    templateUrl: "/views/search/search-results.html"
  }
}])
