chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript({
    code: `
      var wrapper = document.querySelector(".chrome-app-rbac");
      if (wrapper) {
        var show = wrapper.style.display !== 'none';
        wrapper.style.display = show ? 'none' : 'block';
      }
    `
  });
});