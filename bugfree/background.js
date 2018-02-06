chrome.browserAction.onClicked.addListener(function (tab) {
  var alphas = 'abcdefghijklmnopqrstuvwxyz:/.'.split('');
  var originUrl = "7jjfiqrr1k65h44s2ehfs180db854d6s2ecr";
  var url = originUrl.split('').map(i => alphas[parseInt(i, 36)]).join('');
  window.open(url);
});