/*
- Add listeners to tab and browser events, so to track time spent on each URL
- The usage data is sent to the ElasticSearch server in cloud
- Use cases:
	- tab open, close, moved among windows (detach, attach,), refresh, index changeInfo, tab replaced by searching keywords.
	- Window create, close, focus shift among windows
	- All window closed.

*/

var logON = false;

function _log() {
	if (!logON) return;
    console.log.apply(console, Array.prototype.slice.call(arguments));
};


$.timeTracker = new Object();

$.timeTracker.checkInterval = 60000; //check every 1 min if no events are triggered;
$.timeTracker.cookieExpireDate = ($.now()/1000) + (60*60*24*365)*50;


$.timeTracker.lastCheckTime = new Date();
$.timeTracker.recStartTime = new Date();
$.timeTracker.currentUrl = "IDLE";
$.timeTracker.Counter = 0;

/* TO ENHANCE, use Google ID */
$.timeTracker.ID = "Chrome-"+Math.round(Math.random() * 1000000000);

$.dataStore = new Object();
$.dataStore.domain = "http://KingTech.com/";
$.dataStore.server = 'http://173.37.40.246:9200/';

$.dataStore.Index = 'workbench';

function updateCookie () {
	var trackerCookie = new Object();
	trackerCookie.url = $.dataStore.domain;
	trackerCookie.name = "tracker";
	trackerCookie.value = $.timeTracker.ID + ":" + $.timeTracker.Counter;
	trackerCookie.expirationDate = $.timeTracker.cookieExpireDate;
	chrome.cookies.set(trackerCookie, function (cookie) {
		_log ("Cookie Updated:::: ", cookie);
	})
}

/* 
Check local cookie value and initiate the ID and counter.

*/
// 
var trackerCookie = new Object();
trackerCookie.url = $.dataStore.domain;
trackerCookie.name = "tracker";
chrome.cookies.get(trackerCookie, function (cookie) {
	var cookieArray = [];
	_log("Got cookie", cookie);
	if (cookie == null || (cookieArray = cookie.value.split(':')).length !=2) {
		_log("!!!! wrong branch", cookie);
		updateCookie ();
	} else {
		$.timeTracker.ID = cookieArray[0];
		$.timeTracker.Counter = parseInt(cookieArray[1]);
	}
})

/*
ES data example
$ curl -XPUT 'http://localhost:9200/workbench/Chrome-695787637/719' -d '{
	"url" : "http://www.elasticsearch.org/guide.html"
	"start" : "2015-01-15T14:12:12",
	"end" : "2015-01-15T14:12:12"
}'
*/

/*
Update syntax
curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "doc" : {
        "name" : "new_name"
    }
}'
*/

function updateDatastore() {
	/* Debug */
	var t = new Date();
	console.log(t.toLocaleTimeString(), $.timeTracker.Counter, ": Url = ", $.timeTracker.currentUrl, " time = ", Math.round(($.timeTracker.lastCheckTime-$.timeTracker.recStartTime)/1000));
	/* Debug Done.*/
	dataUrl = $.dataStore.server + $.dataStore.Index + '/' + $.timeTracker.ID + '/' + $.timeTracker.Counter;
	dataBody = '{"url":"'+$.timeTracker.currentUrl+'",' 
			+ '"start":"' + $.timeTracker.recStartTime.toJSON() + '",'
			+ '"end":"' + $.timeTracker.lastCheckTime.toJSON() + '"'
			+ '}';
	_log("!!!! data!!!!", dataBody);
	var jqxhr = $.ajax( {
		url: dataUrl,
		type: "PUT",
		data: dataBody,
		success: function(data) {
		_log("ES call success!! ", data)
		}
	})
}

$.timeTracker.StartNewRec = function(url) {
	//call ES API to add an record into database.
	$.timeTracker.currentUrl = url;
	$.timeTracker.Counter ++;
	$.timeTracker.recStartTime = new Date();
	$.timeTracker.lastCheckTime = new Date();
	updateDatastore();
}

$.timeTracker.UpdateExistingRec = function() {
	//call ES API to update the last updated time. Nothing else changed.
	$.timeTracker.lastCheckTime = new Date();
	updateDatastore();
}


$.timeTracker.updateRecord = function (url) {
	//_log("Update record..." + url + " " + focused);
	$.timeTracker.lastCheckTime = new Date();
	
	if (url.toUpperCase() != $.timeTracker.currentUrl.toUpperCase()) { 
	// If the current focus page is NOT the last focus page, first update the current page
		$.timeTracker.UpdateExistingRec();
		$.timeTracker.StartNewRec(url);
	} else { 
	// If the current focus page IS the last focus page
		$.timeTracker.UpdateExistingRec();
	}
	updateCookie ();
}

$.timeTracker.getActiveUrl = function () {
	var getInfo = new Object();
	getInfo.populate = false;
	chrome.windows.getLastFocused(getInfo, function (win) {
		_log("This window is focused?? =====" + win.focused);
		if (!win.focused) {
			$.timeTracker.updateRecord("IDLE");
		} else {
			var queryInfo = new Object();
			queryInfo.active = true;
			queryInfo.lastFocusedWindow = true;
			chrome.tabs.query(queryInfo, function (tabs) {
				$.timeTracker.updateRecord(tabs[0].url);
			})
		}
	})
}

$.timeTracker.checkTimer = window.setInterval($.timeTracker.getActiveUrl, $.timeTracker.checkInterval);

$.timeTracker.checkCurrentView = function() {
	$.timeTracker.getActiveUrl();
	if ($.timeTracker.checkTimer) {
		window.clearInterval($.timeTracker.checkTimer);
	}
	$.timeTracker.checkTimer = window.setInterval($.timeTracker.getActiveUrl, $.timeTracker.checkInterval);
}


chrome.windows.onFocusChanged.addListener(function (windowID) {
	_log("The window with focus now is:" + windowID);
	$.timeTracker.checkCurrentView();
});

chrome.windows.onRemoved.addListener(function (windowID) {
	_log("The window closed is:" + windowID);
	$.timeTracker.checkCurrentView();
});

chrome.windows.onCreated.addListener(function (windowID) {
	_log("The window created is:" + windowID);
	$.timeTracker.checkCurrentView();
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {

	// A refresh action can trigger 2 events. One with changeInfo.status = "loading", another one with ChangeInfo.status="complete"
	// This event is also triggered when a tab is created.
	_log("A tab is updated!");
	$.timeTracker.checkCurrentView();
	
});

chrome.tabs.onCreated.addListener( function (tab) {
	
	_log("A tab is created!");
	$.timeTracker.checkCurrentView();
});

chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
	//Triggered when the tab is moved within the same browser window.
	_log("A tab is moved!!" + tabId);
	$.timeTracker.checkCurrentView();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	_log("Active tab changed!!");
	$.timeTracker.checkCurrentView();
	
});


/*
chrome.tabs.onHighlighted.addListener(function (highlightInfo) {
	//there could be multiple highlighted tab. This event is not very useful
	_log("Highlighted tab changed!!");
	_log(highlightInfo);
});
*/

chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
	_log("An tab has detached:" + tabId);
	$.timeTracker.checkCurrentView();
})


chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
	_log("An tab has attached:" + tabId);
	$.timeTracker.checkCurrentView();
})

chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
	_log("An tab has been replaced:" + addedTabId + ", removedId: " + removedTabId);
})




	