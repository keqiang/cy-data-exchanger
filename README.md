# cy-data-exchanger
A Chrome extension exchanges data between your web application and Cytoscape desktop application. It can read the Cytoscape table data and also can perform action like select specified network nodes in the Cytoscape network view.

## Examples

### Listening to data change

In your front-end code, you can add an event listener to handle the updated data such as the current selected node list from Cytoscape.

```Javascript

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;
  if (event.data.type === "cytoscapeSelectedNodes") {
    // Do some thing with the data
    alert(event.data.selection);
  } else if (event.data.type === "chromeExtensionStatus") {
    // Do some thing with the status
    alert(event.data.status);
  }
}, false);

```

### perform an action

In your front-end code, you can post a message to control your local Cytoscape application to perform an action such as selecting nodes in the current network view.

```Javascript
var chromeExtensionId = "xxxxxxxxxxxxxxxxxxxxxxxgcdj"; // this value will be different in your setting
// the chromeExtensionId is a variable you define with the extension id. It can be found in 'manage extension'
chrome.runtime.sendMessage(chromeExtensionId, "selectCytoscapeNodes");

```
