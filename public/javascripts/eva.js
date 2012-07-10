  var timer;
  var opend_at; //公開日
  var canvas;
  var stage;
  var list = []
   function init() {
     opened_at = new Date(2012,11,17,0,0,0);
     canvas = document.getElementById("canvas"); // canvas要素を取得
     stage = new Stage(canvas); // Stageにセットする

     for(i=0;i<200;i++){
       e = new Message();
       if(Math.random() > 0.5){
         e.x = canvas.offsetWidth - 500;
       }else{
         e.x = canvas.offsetWidth + 500;
       }
       e.y = Math.random() * canvas.offsetHeight;
       list.push(e);
     }

    for(i=0; i<list.length; i++){
      stage.addChild(list[i]);
    }

    Ticker.addListener(window); // window.tick()を40FPSで呼び出す
    Ticker.setFPS(30);
  }

  function tick(){
    for(i=0; i< list.length; i++){
      c = list[i];
      if(Math.random() > 0.5)
      {
         c.x += Math.random() * 5;
         c.y -= Math.random() * 5;
      }else{
        c.x -= Math.random() * 5;
        c.y -= Math.random() * 5;
      }
      if(c.y < 0){
        c.y = 600;
      }
    }
    stage.update();
  }

  window.onload = init;
