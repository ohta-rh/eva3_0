//Message
(function(window){
  Message.prototype = new Shape();
  Message.prototype._parentInitialize = Message.prototype.initialize;
  Message.prototype._parentTick = Message.prototype._tick;

  function Message(prop){
    circle = this.initialize();
    circle.graphics.beginFill("#064D5E");
    circle.graphics.setStrokeStyle(8);
    circle.graphics.beginStroke("#0000FF");
    circle.graphics.beginStroke("white");
    circle.graphics.drawCircle(0,0,73);
    circle.alpha = 0.3;
    circle.graphics.endFill();
    return circle;
  }
  Message.prototype.initialize = function() {
    this._parentInitialize();
    hoge = new Shape();
    return hoge;
  }

  Message.prototype._tick = function(){
    this._parentTick();
  }
  window.Message = Message;
}(window));
