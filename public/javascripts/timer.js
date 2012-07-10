(function(window){
var opened_at = '2012/11/17 8:00:00';
var day, hour, min, sec;
var timer;

function start(){
  Timer1=setInterval(function(){
    today = new Date();
    diff = Date.parse(opened_at) - Date.parse(today);
    day = parseInt(diff / 86400000)
    diff = diff - ( day * 86400000)
    hour = parseInt( diff / 3600000 )
    diff = diff - ( hour * 3600000 )
    min = parseInt(  diff / 60000 )
    diff = diff - ( min * 60000 )
    sec = parseInt( diff / 1000)
    if(hour < 10) { hour = "0" + hour; }
    if(min < 10) { min = "0" + min; }
    if(sec < 10) { sec = "0" + sec; }
    hms_text =  hour + ":" + min + ":" + sec
    $("#timer").html(hms_text);
    $("#day").html(day);
  },1000);
}

start();
}(window));
