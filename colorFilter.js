/* 2015/10/27 kyoshida
 *
 * 使い方
 * colorFilter.effectBinarize(Context)でContextのImageDataを白黒にして反映,過去3件保存
 * colorFilter.captureImage(Context)で差分画像を取得,現在選択している色情報と共に保存
 * colorFilter.compositImage(Context)で差分画像に色情報を適用し合成して,入力のコンテキストに反映
 *
 * TODO
 *  ノイズ処理を行っていない
 */


var colorFilter = (function(){
    var module = {};
    module.colorKey = 0;//0:黒,1:赤,2:緑,3:青
    module.threshold = 50;//白黒の閾値
    module.imageDataStack = [];
    module.colorDataStack = [];
    module.iBoardImageData= [];
    module.instantImageDataStack=[];
    module.getColor = function(colorNumber){
        switch(colorNumber){
                case 0:
                //黒
                return {r:0,g:0,b:0};
                case 1:
                //赤
                return {r:255,g:0,b:0};
                case 2:
                //緑
                return {r:0,g:255,b:0};
                case 3:
                //青
                return {r:0,g:0,b:255};
                default:
                //白
                return {r:255,g:255,b:255};
        }
    };

    /**
     * 画像の切り出しと差分計算と保存
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    module.captureImage = function(context){
        var imageData = context.getImageData(0,0,canvas.width,canvas.height),
        data = imageData.data;
        var canvasElement = document.createElement('canvas');
        canvasElement.width=canvas.width;
        canvasElement.height = canvas.height;
        var ctx = canvasElement.getContext('2d');

        //分解してimageDataStackに保管
        var currentImageData = module.instantImageDataStack.pop();
        currentImageData.data = module.getDistance(currentImageData);
        module.imageDataStack.push(currentImageData);
        module.colorDataStack.push(module.getColor(module.colorKey));
        ctx.putImageData(currentImageData,0,0);
        document.body.appendChild(canvasElement);
    }

    module.compositImage = function(context){
        console.log(module.colorDataStack);
        var imageData = context.getImageData(0,0,canvas.width,canvas.height);
        var data = imageData.data;
        var colorImageDataStack = [];
        for(var i=0;i<module.imageDataStack.length;i++){
            colorImageDataStack.push(module.selectColorFilter(module.imageDataStack[i],module.colorDataStack[i]));
        }

        for(var i=0;i<data.length;i=i+4){
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
            for(var j= 0; j< colorImageDataStack.length;j++){
                data[i]=data[i] - (255-colorImageDataStack[j][i]);
                data[i+1]=data[i+1] - (255-colorImageDataStack[j][i+1]);
                data[i+2]=data[i+2] - (255-colorImageDataStack[j][i+2]);
            }
            if(data[i]<0){
                data[i] = 0;
            }
            if(data[i+1]<0){
                data[i+1] = 0;
            }
            if(data[i+2]<0){
                data[i+2] = 0;
            }
        }
        imageData.data = data;
        context.putImageData(imageData,0,0);
    }




    /**
     * 2色(白,黒)->(白,{r,g,b})
     * @param  {[type]} imageData [description]
     * @param  {[type]} colorData [description]
     * @return ImageData.data           [description]
     */
    module.selectColorFilter = function(imageData,colorData){
        var data = imageData.data;
        for(var i=0; i<data.length;i=i+4){
            if(data[i] == 0){
                data[i]=colorData.r;
                data[i+1] = colorData.g;
                data[i+2] = colorData.b;
            }
        }
        return data;
    }


    /**
     * 更新分を抽出
     * @param  {[type]} imageData [description]
     * @return ImageData.data           [description]
     */
    module.getDistance = function(imageData){
        var data = imageData.data;
        for(var i=0; i<module.imageDataStack.length;i++){
            var iImageData = module.imageDataStack[i];
            var iData = iImageData.data;
            for(var j=0; j<data.length;j=j+4){
                if(data[j] == 0){
                    if(iData[j] == 0){
                        data[j]=255;
                        data[j+1]=255;
                        data[j+2]=255;
                    }
                }
            }

        }



        return data;
    }

    /**
     * 3つまでImageDataを保管する
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    module.pushInstantImageStack = function(context){
        module.instantImageDataStack.push(context.getImageData(0,0,canvas.width,canvas.height));
        if(module.instantImageDataStack.length >3){
            module.instantImageDataStack.shift();
        }
    }

    module.binarizeFilter = function(imageData){
        for(var i=0;i<imageData.length;i=i+4){
            var B =  0.298912 * imageData[i] + 0.586611 * imageData[i+1] + 0.114478 * imageData[i+2];
            if(B>module.threshold){
                B = 255;
            }else{
                B = 0;
            }
            imageData[i] = B;
            imageData[i+1]=B;
            imageData[i+2]=B;
            imageData[i+3]=255;

        }
        //imageData.data = data;
        return imageData;
       // canvas.getContext('2d').putImageData(imageData,0,0);
    }

    /**
     * 二色化フィルター,直近3つのイメージデータを保持
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    module.effectBinarize = function(context){
         var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;
            //TODO 3フレームの平均をとる->module.getAverageColor(imageData);
            imageData.data = module.binarizeFilter(data);
        context.putImageData(imageData, 0, 0);
        //モジュールで保管
        module.instantImageDataStack.push(imageData);

    }





    // module.getAverageColor= function(imageDatas){
    //     var nImageData=[];

    //     var imageData1 = imageDatas[0];
    //     var imageData2 = imageDatas[1];
    //     var imageData3 = imageDatas[2];
    //     for(var i=0; i<imageData1; i=i+4){
    //         nImageData[i] = (imageData1[i]+imageData2[i]+imageData3[i])/3;
    //         nImageData[i+1] = (imageData1[i+1]+imageData2[i+1]+imageData3[i+1])/3;
    //         nImageData[i+2] = (imageData1[i+2]+imageData2[i+2]+imageData3[i+2])/3;
    //         nImageData[i+3] = (imageData1[i+3]+imageData2[i+3]+imageData3[i+3])/3;
    //     }
    //     return nImageData;
    // }


    module.getIBoard = function(){
        module.imageDataStack.push(module.getDistance());
        colorDataStack.push(module.getColor(module.colorKey));
        var nImageDataStack =[];
        for(var i=0; i<module.imageDataStack.length;i++){
            nImageDataStack[i] = module.changeColor(imageDataStack[i],colorDataStack[i]);
        }

        for(var j=0; j<nImageDataStack[0].length;j=j+4){

            for(var i=0; i< nImageDataStack.length;i++){
                module.iBoardImageData[j] = iBoardImageData[j]+(255-nImageDataStack[i][j]);
                module.iBoardImageData[j+1] = iBoardImageData[j+1]-(255-nImageDataStack[i][j+1]);
                module.iBoardImageData[j+2] = iBoardImageData[j+2]-(255-nImageDataStack[i][j+2]);

            }
                if(moduleiBoardImageData[j] < 0){
                    module.iBoardImageData = 0;
                }
                if(iBoardImageData[j+1] < 0){
                    module.iBoardImageData = 0;
                }
                if(iBoardImageData[j+2] < 0){
                    module.iBoardImageData = 0;
                }
                module.iBoardImageData[j+3] = 255;
        }



    }

    module.changeColor = function(imageData,color){
        for(var i=0; i<imageData.length;i=i+4){
            if(imageData[i] == 0){
                imageData[i] = color.r;
                imageData[i+1] = color.g;
                imageData[i+2] = color.b;
            }
        }
        return imageData;
    }


    return module;
})();






var edgeDetector = (function(){

    var module = {};

    module.sobelFilterH = new Array(
        1,0,-1,
        2,0,-2,
        1,0,-1
        );

    module.sobelFilterV = new Array(
        1,2,1,
        0,0,0,
        -1,-2,-1
        );

    module.laplacian4Filter = new Array(
         0, 1, 0,
         1, -4, 1,
         0, 1, 0
        );

    module.laplacian8Filter = new Array(
         1, 1, 1,
         1, -8, 1,
         1, 1, 1
        );

    module.effectGrayScale = function(canvas){
        var context = canvas.getContext('2d');
         var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;
            //TODO 3フレームの平均をとる->module.getAverageColor(imageData);
            imageData.data = module.grayScaleFilter(data);
        context.putImageData(imageData, 0, 0);

    }

    module.grayScaleFilter = function(imageData){
        for(var i=0; i<imageData.length;i=i+4){
            var ys = module.grayScale(imageData[i],imageData[i+1],imageData[i+2]);
            imageData[i] = ys;
            imageData[i+1] = ys;
            imageData[i+2] = ys;
        }

        return imageData;
    }

    module.grayScale = function(r,g,b){
        return r*0.298912 + g*0.586611 + b * 0.114478;
    }


    module.edgeDetector = function(canvas){
        var _canvasW = canvas.width;
        var _canvasH = canvas.height;
        var context = canvas.getContext('2d');
        var imageData = context.getImageData(0,0,canvas.width,canvas.height);
        var data = imageData.data;
        var grayScaleData = new Array(_canvasH*_canvasW);

        for(var i=0;i<data.length;i=i+4){
            grayScaleData[i/4] = module.grayScale(data[i],data[i+1],data[i+2]);
        }

        var resultImage = module.spatialFilter(grayScaleData,_canvasH,_canvasW,module.laplacian8Filter,3);

        for(var i=0;i<data.length;i++){
            data[i*4] = resultImage[i];
            data[i*4+1] = resultImage[i];
            data[i*4+2] = resultImage[i];
        }
        imageData.data = data;
        context.putImageData(imageData, 0, 0);
    }

    module.spatialFilter = function(grayImage,height,width,filter,size_f){
        var init = Math.floor(size_f/2);
        var from = -init;
        var to = init;

        var resultImage = new Array(height*width);
        for(var i= 0;i<resultImage.length;i++){
            resultImage[i];
        }

        for  (var i = init; i < height - init; i++) {
            for (var j = init; j < width - init; j++) {
              var sum = 0.0;
              /* フィルタリング */
              for (var n = from; n <= to; n++) {
                for (var m = from; m <= to; m++) {
                  sum += grayImage[(i + n) * width + j + m] *
                    filter[(n + init) * size_f + m + init];
                }
              }
              resultImage[i * width + j] = Math.floor(Math.abs(sum));
            }
          }
        return resultImage;
    }

    module.getEdgeMap = function(canvas){
      var _canvasW = canvas.width;
      var _canvasH = canvas.height;
      var context = canvas.getContext('2d');
      var imageData = context.getImageData(0,0,canvas.width,canvas.height);
      var data = imageData.data;
      var grayScaleData = new Array(_canvasH*_canvasW);

      for(var i=0;i<data.length;i=i+4){
          grayScaleData[i/4] = module.grayScale(data[i],data[i+1],data[i+2]);
      }

      var resultImage = module.spatialFilter(grayScaleData,_canvasH,_canvasW,module.laplacian8Filter,3);

      return resultImage;
    }

    module.getInitialEdgeMap = function(sWidth,sHeight){
      var initialEdgeMap = new Array(sWidth*sHeight);
      for(var i=0;i<sWidth*sHeight;i=i++){
          initialEdgeMap[i] = 0;
      }

      return initialEdgeMap;

    }

    module.getEdgeCount = function(EdgeMap){
        var count = 0;
        for(var i=0; i< EdgeMap.length; i++){
          if(EdgeMap[i] == 1){
            count++;
          }
        }
        return count;
    }

    module.getEdgeCountWithCanvas = function(canvas){
      var count = 0;
      var edgeMap = module.getEdgeMap(canvas);
      for(var i=0; i<edgeMap.length; i++){
        if(edgeMap[i] > 50){
          count++;
        }
      }

      return count;
    }

    module.makeEdgeMap = function(edgeMapArr){
      var targetCanvas = document.createElement('canvas');
      targetCanvas.width = screen.width;
      targetCanvas.height = screen.height;
      var context = targetCanvas.getContext('2d');
      context.fillRect(0,0,screen.width,screen.height);
      async.forEachSeries(edgeMapArr, function(value, callback) {
        //各要素実行
        context.drawImage(value.map,value.left,value.top,value.width,value.height);
        callback();

      }, function() {
        //最終実行
        module.edgeDetector(targetCanvas);

      });
      return targetCanvas;
    }

    module.recommendPositionWithpositionCandidateListandEdgeImage = function(currentEdgeMapCanvas,referenceWindowEdgeMapCanvas,activeWindowCanvas,positionCandidateList){
      //edgeMap
      //var currentImageData = currentEdgeMapCanvas.getImageData(0,0,currentEdgeMapCanvas.width,currentEdgeMapCanvas.height);
      async.map(positionCandidateList,function(value,callback){
          value.edgeCount = module.getEdgeCountWithPositionCandidate(currentEdgeMapCanvas,referenceWindowEdgeMapCanvas,value);
          console.log(value);
          callback(null,value);
      },function(err,resultsCount){
        //sort
          async.sortBy(resultsCount, function(item, done){
              done(null, item.edgeCount*-1);
          }, function(err,results){
              if (err){
                 console.error(err);
              }else{
               console.log(results);
              var recommendPosition = results[0];
              var resultCanvas = document.createElement('canvas');
              resultCanvas.width = screen.width;
              resultCanvas.height = screen.height;
              var resultContext = resultCanvas.getContext('2d');
              resultContext.drawImage(currentEdgeMapCanvas,0,0,currentEdgeMapCanvas.width,currentEdgeMapCanvas.height);
              resultContext.drawImage(activeWindowCanvas.map,activeWindowCanvas.left,activeWindowCanvas.top,activeWindowCanvas.width,activeWindowCanvas.height);
              console.log('edgeCount');
              console.log(recommendPosition.edgeCount);

              resultContext.drawImage(referenceWindowEdgeMapCanvas,recommendPosition.left,recommendPosition.top,referenceWindowEdgeMapCanvas.width,referenceWindowEdgeMapCanvas.height);
               edgeDetector.edgeDetector(resultCanvas);
              document.body.appendChild(resultCanvas);
              }

          });



      });


      return positionCandidateList;
    }

    module.getEdgeCountWithPositionCandidate = function(currentEdgeMapCanvas,referenceWindowEdgeMap,positionCandidate){
      //単:czImageDataにpositionCandidateの候補の場所におき確認する
      //edgeMap処理済みを使用すること
      var targetCanvas = document.createElement('canvas');
      targetCanvas.width = screen.width;
      targetCanvas.height = screen.height;
      var targetContext = targetCanvas.getContext('2d');
      targetContext.drawImage(currentEdgeMapCanvas,0,0);
      targetContext.drawImage(referenceWindowEdgeMap,positionCandidate.left,positionCandidate.top);

      var count = module.getEdgeCountWithCanvas(targetCanvas);
      console.log(count);
      return count;
      }

      module.getTranscarentImageUrl = function(image,width,height){
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        context.drawImage(image,0,0);
        console.log(canvas.width);
        var imageData = context.getImageData(0,0,canvas.width,canvas.height);
        var data = imageData.data;
        for(var i =0; i< data.length;i = i+4){
            data[i+3] = data[i+3] / 2; 
        }
        console.log(data.length/4);
        imageData.data = data;
        context.putImageData(imageData, 0, 0);
        var dataurl = canvas.toDataURL("image/png");

        return dataurl;
    }

    return module;

})();


   function setScreenEdgeMap(){
        swb.transmitRequest({
            S: '.',
            D: '..',
            C: 'screenshot',
            P: {
                value: {
                    left: 0,
                    top: 0,
                    width: screen.width,
                    height: screen.height,
                    type: 'image/png'
                }
            }
        }, function (requet, response) {
            var dataurl = response.P.value.data;
            var mapImage = new Image();
            mapImage.onload = function(){
                var mapCanvas = document.createElement('canvas');
                mapCanvas.width = screen.width;
                mapCanvas.height = screen.height;
                var mapContext = mapCanvas.getContext('2d');
                mapContext.drawImage(mapImage,0,0,mapCanvas.width,mapCanvas.height);
                screenEdgeMap = edgeDetector.getEdgeMap(mapCanvas);
                var nTester = new Array(2000);
                for(var i=0; i<2000;i++){
                    nTester[i] = screenEdgeMap[i+200000];
                }
                telepath.send({to:'testLayer',body:{
                    act:'consoleA',data:nTester
                }},function(req,res){});

                }
            mapImage.src = dataurl;
        });
    }

    
    function upsertSemiAutoClipping(thumbnail){
        //thumbnail:{id,img,width,height}
        var addImage = new Image();
        addImage.width = thumbnail.width;
        addImage.height = thumbnail.height;
        addImage.id = thumbnail.id;
        addImage.style.opacity = 0.5;
        addImage.style.position = 'absolute';
        addImage.className = 'autoClipping';
        addImage.onload = function(){
            var exClip = document.getElementsByClassName('autoClipping');
            
            if(exClip.length > 0){
                var aClip = exClip[0];
                addImage.style.left = aClip.style.left;
                addImage.style.top = aClip.style.top;
                $('#'+aClip.id).remove();
                var addCanvas = document.createElement('canvas');
                var addContext = addCanvas.getContext('2d');
                addContext.drawImage(addImage,0,0,thumbnail.width,thumbnail.height);
                imageEdgeMap = edgeDetector.getEdgeMap(addCanvas);
                document.getElementById('item_board').appendChild(addImage);
                //TODO 自動移動メソッドをsetIntervalでセットする
               clearInterval(moveInterval);
                moveInterval = null;
               moveInterval =  setInterval(function(){calculate8Direction()},1000);
            }else{
                setScreenEdgeMap();

                addImage.style.left = String(Math.random()*(screen.width-addImage.width))+"px";
                addImage.style.top = String(Math.random()*(screen.height-addImage.height))+"px";
                //addImage.style.left = "400px";
                //addImage.style.top = "300px";
                var addCanvas = document.createElement('canvas');
                var addContext = addCanvas.getContext('2d');
                addContext.drawImage(addImage,0,0,thumbnail.width,thumbnail.height);
                imageEdgeMap = edgeDetector.getEdgeMap(addCanvas);
                telepath.send({to:'testLayer',body:{act:'consoleA',data:{edge:imageEdgeMap,width:addImage.width,left:addImage.style.left,img:thumbnail.img}}});

                document.getElementById('item_board').appendChild(addImage);
                //TODO 自動移動メソッドをsetIntervalでセットする
                clearInterval(moveInterval);
                moveInterval = null;
               moveInterval = setInterval(function(){
                  telepath.send({to:'testLayer',body:{act:'consoleA',data:"go"}},function(){
                        calculate8Direction()
                  });},1000);  
            }
        }
        addImage.src = thumbnail.img;
    }

    function stopSemiAutoClipping(){
        clearInterval(moveInterval);
        moveInterval = null;
        $('.autoClipping').remove();

    }

    function calculate8Direction(){
        //差が最大
        var AC = Math.floor(Math.random()*50);
        var targetImage = document.getElementsByClassName('autoClipping')[0];
        telepath.send({to:'testLayer',body:{act:'consoleA',data:targetImage.left}});

        var directions = new Array();
        var direction1 = {
            left:parseInt(targetImage.style.left)+AC,
            top:parseInt(targetImage.style.top),
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction2 = {
            left:parseInt(targetImage.style.left)-AC,
            top:parseInt(targetImage.style.top),
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction3 = {
            left:parseInt(targetImage.style.left),
            top:parseInt(targetImage.style.top)+AC,
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction4 = {
            left:parseInt(targetImage.style.left),
            top:parseInt(targetImage.style.top)-AC,
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction5 = {
            left:parseInt(targetImage.style.left)+AC,
            top:parseInt(targetImage.style.top)+AC,
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction6 = {
            left:parseInt(targetImage.style.left)+AC,
            top:parseInt(targetImage.style.top)-AC,
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction7 = {
            left:parseInt(targetImage.style.left)-AC,
            top:parseInt(targetImage.style.top)+AC,
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        var direction8 = {
            left:parseInt(targetImage.style.left)-AC,
            top:parseInt(targetImage.style.top)-AC,
            width:parseInt(targetImage.width),
            height:parseInt(targetImage.height)
        };
        telepath.send({to:'testLayer',body:{act:'consoleA',data:direction1}});
        directions.push(direction1);
        directions.push(direction2);
        directions.push(direction3);
        directions.push(direction4);
        directions.push(direction5);
        directions.push(direction6);
        directions.push(direction7);
        directions.push(direction8);


        async.map(directions,function(value,next){
            var score = calculateSumAbsSub(value); 
            value.score = score;
            next(null,value);

        },function(err,resultList){
            if(err){
                console.error(err);
            }else{
                async.sortBy(resultList, function(item, done){
               //console.log(item);
                  done(null, item.score*-1);
                }, function(err,results){
                  if (err){
                     console.error(err);
                  }else{
                    console.log(results);
                     
                     telepath.send({to:'testLayer',body:{act:'consoleA',data:results}});
                    //移動処理
                    // if(currentScore >= results[0].score){
                    //     clearInterval(moveInterval);
                    //     moveInterval = null;
                    // }else{
                     targetImage.style.left = String(results[0].left) + "px";
                    targetImage.style.top = String(results[0].top) + "px";
                    currentScore = results[0].score;
                    //}
                    //console.error(currentScore);
                }

                });

            }
        });

    }

    function calculateSumAbsSub(direction){
        var fromX = direction.left;
        var lengthX = direction.width;
        var fromY = direction.top;
        var lengthY = direction.height;

        if(fromX<0){
            return 0;
        }
        if(fromX + lengthX > screen.width){
            return 0;
        }
        if(fromY < 0){
            return 0;
        }
        if(fromY + lengthY > screen.height){
            return 0;
        }

        var score = 0;
        for(var i = fromY; i<fromY+lengthY;i++){
            for(var j = fromX; j< fromX+lengthX; j++){
                //screenEdgeMap
                //imageEdgeMap
                score = score - Math.abs(screenEdgeMap[screen.width*i + j]-imageEdgeMap[(i-fromY) + j-fromX]);

            }
        }

        return score;

    }


