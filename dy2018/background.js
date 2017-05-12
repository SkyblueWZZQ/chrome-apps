chrome.browserAction.onClicked.addListener(function(){
	var domain = Date.now() % 2000 > 1000 ? 'xiaopian' : 'dy2018';
	window.open(`http://www.${domain}.com/`);
});