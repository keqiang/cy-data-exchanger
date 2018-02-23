/**
 * General Messages
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // Called by content script to clear cache
        if (request.type === "reset") {
            cytoscapeSelectedNodes = [];
            // Message indicating if the page is active or not
        } else if (request.type === "visibility") {
            // When the page becomes visible, enable the
            if (request.isVisible) {
                recoverPolling();
            } else {
                suspendAllPolling();
            }
        }
        return true;
    }
);

chrome.tabs.onRemoved.addListener(function(tabid, removed) {
    suspendAllPolling();
});

chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'dataExchangeStatus') {
            sendResponse({
                cytoscapeNodePollingEnabled: cytoscapeNodePollingEnabled,
                cytoscapeReceivingEnabled: cytoscapeReceivingEnabled
            })
        }
        return true;
    }
);

var cytoscapeReceivingEnabled = false;

let pollingInterval = 800;

var cytoscapeSelectedNodes = [];

var cyIntervalId;

var cytoscapeNodePollingEnabled = false;

function recoverPolling() {
    suspendAllPolling();

    if (cytoscapeNodePollingEnabled) {
        cyIntervalId = setInterval(pollCytoscapeSelectedNodes, pollingInterval);
    }
}

function suspendAllPolling() {
    clearInterval(cyIntervalId);
}

// -------------------------------------------------- Global Section --------------------------

chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "changeCrossTalkSetting") {
            updateCrossTalkSetting(request.apps);
        }
        return true;
    }
);

function updateCrossTalkSetting(apps) {
    if (apps === null) {
        apps = [];
    }

    if (apps.indexOf("Cytoscape") >= 0) {
        cyIntervalId = setInterval(pollCytoscapeSelectedNodes, pollingInterval);
        cytoscapeNodePollingEnabled = true;
        cytoscapeReceivingEnabled = true;
    } else {
        clearInterval(cyIntervalId);
        cytoscapeSelectionUpdated([]);
        cytoscapeSelectedNodes = [];
        cytoscapeNodePollingEnabled = false;
        cytoscapeReceivingEnabled = false;
    }

    if (apps.indexOf("IGV") >= 0) {

    } else {

    }
}

/**
 * ******************* Cytoscape Section ***************************
 */

var CYTOSCAPE_URL = "http://localhost:1234/v1/"
var CYTOSCAPE_NETWORKS_URL = CYTOSCAPE_URL + "networks/";

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(i = 0; i < arr1.length; i++) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

function cytoscapeSelectionUpdated(selectedNodeNames) {
    if (!arraysEqual(selectedNodeNames, cytoscapeSelectedNodes)) {
        cytoscapeSelectedNodes = selectedNodeNames;
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "cytoscapeSelection",
                    selection: cytoscapeSelectedNodes
                });
            }
        });
    }
}

function pollCytoscapeSelectedNodes() {

    var xmlhttp = new XMLHttpRequest();
    var url = CYTOSCAPE_NETWORKS_URL.concat("?column=selected&query=true");

    xmlhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var selectedNetworksIds = JSON.parse(this.responseText);
            if (selectedNetworksIds.length > 0) {
                var xmlhttp1 = new XMLHttpRequest();
                url = CYTOSCAPE_NETWORKS_URL.concat(selectedNetworksIds[0], "/tables/defaultnode/rows");

                xmlhttp1.onreadystatechange = function() {
                    if (this.readyState === 4 && this.status === 200) {
                        var allNodes = JSON.parse(this.responseText);
                        var selectedNodeNames = [];
                        for (var i = 0; i < allNodes.length; ++i) {
                            var node = allNodes[i];
                            if (node.selected) {
                                selectedNodeNames.push(node.name);
                            }
                        }

                        cytoscapeSelectionUpdated(selectedNodeNames)
                    }
                }

                xmlhttp1.open("GET", url, true);
                xmlhttp1.send();
            }
        }
    };

    xmlhttp.open("GET", url, true);

    xmlhttp.send();

}

function selectCytoscapeNodes(nodes) {
    var xmlhttp = new XMLHttpRequest();
    var url = CYTOSCAPE_NETWORKS_URL.concat("?column=selected&query=true");

    xmlhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var selectedNetworksIds = JSON.parse(this.responseText);
            if (selectedNetworksIds.length > 0) {
                var xmlhttp1 = new XMLHttpRequest();
                if (nodes.constructor !== Array) {
                    nodes = [nodes];
                }
                var nodesToBeUpdated = [];
                for (var i = 0; i < nodes.length; i++) {
                    var nodeId = nodes[i];
                    var nodeToBeUpdated = {
                        "name": nodeId,
                        "selected": true
                    };
                    nodesToBeUpdated.push(nodeToBeUpdated);
                }
                var jsonRequest = {
                    "data": nodesToBeUpdated,
                    "dataKey": "name",
                    "key": "name"
                };

                url = CYTOSCAPE_NETWORKS_URL.concat(selectedNetworksIds[0], "/tables/defaultnode");

                xmlhttp1.open("PUT", url, true);
                xmlhttp1.setRequestHeader('Content-type', 'application/json');
                xmlhttp1.send(JSON.stringify(jsonRequest));
            }
        }
    };

    xmlhttp.open("GET", url, true);

    xmlhttp.send();
}

/**
 * Messages that perform actions on Cytoscape
 */

chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        if (!cytoscapeReceivingEnabled) return false;
        if (request.type === "selectCytoscapeNodes") {
            selectCytoscapeNodes(request.nodes);
        }
        return true;
    }
);
