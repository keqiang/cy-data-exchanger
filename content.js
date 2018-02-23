/**
 * Created by Keqiang Li on 7/13/17.
 */

window.postMessage({ type: "chromeExtensionStatus", status: "installed" }, "*");

chrome.runtime.sendMessage({type: "reset"});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "cytoscapeSelection") {
            window.postMessage({ type: "cytoscapeSelectedNodes", selection: request.selection }, "*");
        }
    }
);

// when the page's visibility changes, send the message to the background script
document.addEventListener('visibilitychange', function(){
    message = {type: "visibility", isVisible: !document.hidden};
    chrome.runtime.sendMessage(message);
});
