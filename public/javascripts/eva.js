  var timer;
  var opend_at; //公開日
  var canvas;
  var stage;
  var list = []
  var socket;
  var product_url = 'http://you-can-not-redo.herokuapp.com'
   function init() {

     socket = location.hostname == 'localhost' ? io.connect("http://localhost:3000") : io.connect(product_url);
     socket.on("connect");

     //Socket関係=====START
     socket.on("message", function (data) {
       label = new Text(data.value, "20px arial", "#FFF");
       e = new Message();
       if(Math.random() > 0.5){
         e.x = Math.random() * 1200;
       }else{
         e.x = Math.random() * 800;
       }
       e.y = Math.random() * 400;
       label.x = e.x
       label.y = e.y
       stage.addChild(e)
       stage.addChild(label)
       list.push(e);
     });

     $('#send-btn').click(function(){
       msg = $("#text-box").val();
       $("#text-box").val("");
       if (msg.length > 0) {
         socket.emit("message", {value:msg})
        }
     });

     
     //=================END

     opened_at = new Date(2012,11,17,0,0,0);
     canvas = document.getElementById("canvas"); // canvas要素を取得
     stage = new Stage(canvas); // Stageにセットする

     for(i=0;i<30;i++){
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
