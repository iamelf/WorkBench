console.log("Maggie good job!!");
/*
function onchange (evt) {
	var v = "visible", h = "hidden";
	var vis = h;
	var evtMap = {
		focus:v, 
		focusin:v, 
		pageshow:v, 
		blur:h, 
		focusout:h, 
		pagehide:h
	};
	console.log("-----event type = " + evt.type);
	evt = evt || window.event;
	if (evt.type in evtMap)
		vis = evtMap[evt.type];
	else
		vis = this[hidden] ? "hidden" : "visible";
	
	console.log("------page is " + vis);
}
*/

/*
var hidden = "hidden"; 

if (hidden in document) {
    document.addEventListener("visibilitychange", onchange);
} else {
	window.onpageshow = window.onpagehide
    = window.onfocus = window.onblur = onchange;
}
*/

$(window).blur(function(){
  //your code here
	console.log("onBlur......");
});
$(window).focus(function(){
  //your code
	console.log("onFocus!!!!");
});

/*
window.addEventListener("focus") = function() {
	console.log("onFocus!!!!");
	chrome.runtime.sendMessage({focus: "GET"}, function(response) {
      console.log(response);
	});
};

window.addEventListener("blur") = function() {
	console.log("onBlur......");
	//$.timeTracker.getActiveUrl();
	chrome.runtime.sendMessage({focus: "LOST"}, function(response) {
      console.log(response);
	});
};
*/
/*
window.onfocus = function() {
	console.log("onFocus!!!!");
	chrome.runtime.sendMessage({focus: "GET"}, function(response) {
      console.log(response);
	});
};

window.onblur = function() {
	console.log("onBlur......");
	//$.timeTracker.getActiveUrl();
	chrome.runtime.sendMessage({focus: "LOST"}, function(response) {
      console.log(response);
	});
};

console.log("event register done");
chrome.runtime.sendMessage({focus: "GET"}, function(response) {
	console.log(response);
});
*/

