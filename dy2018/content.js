var textarea = document.createElement('textarea');

textarea.style.position = "fixed";
textarea.style.visibility = "hidden";
textarea.style.left = "0px";
textarea.style.top = "0px";
textarea.style.width = "80%";
textarea.style.height = "150px";
textarea.style.zIndex = Number.MAX_SAFE_INTEGER;
document.body.appendChild(textarea);

function getDownUrlString() {
	var downUrlDom = document.querySelectorAll('a[thundertype]');
	var downUrlString = Array.from(downUrlDom).map(e => e.innerText).join('\n');
	return downUrlString.trim();
}
window.onload = function() {
	var count = 0;

	function clearAd() {
		var ad = document.querySelector('body > a');
		if (ad) {
			document.body.removeChild(ad);
		} else if (++count < 10) {
			console.log(count);
			setTimeout(clearAd, 1000);
		}
	}
	clearAd();
}
var keysQueue = [];
window.onkeyup = function(e) {
	var key = e.key;
	if (e.ctrlKey) {
		key = 'ctrl+' + key;
	}
	keysQueue.push(key);
	console.log(keysQueue.join(','));
	if (keysQueue.length > 2) {
		keysQueue.shift();
	}
	var isCopyCommand = 'ctrl+i,ctrl+c' === keysQueue.join(',');
	var visible = textarea.style.visibility == 'visible';
	if (visible) {
		if (e.key === 'Escape') {
			textarea.style.visibility = 'hidden';
		}
	} else if (isCopyCommand) {
		if (textarea.value = getDownUrlString()) {
			textarea.style.visibility = 'visible';
			textarea.focus();
			textarea.select();
		} else {
			// document.title = '没有找到下载地址';
		}
	}
}