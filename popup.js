document.addEventListener('DOMContentLoaded', function () {

  // initialize the size of the switches to 'mini'
  $.each($(".polling-switch"), function(idx, elem) {
    $(elem).attr("data-size", "mini");
  });

  // initialize as boostrap switch, which is prettier
  $(".polling-switch").bootstrapSwitch();

  // restore the status for the switches
  restoreCheckboxStatus();

  $('.polling-switch').on('switchChange.bootstrapSwitch', function(event, state) {
    chrome.runtime.sendMessage({
      type: this.id,
      enabled: state
    });
  });

});

function restoreCheckboxStatus() {
  chrome.runtime.sendMessage({
    type: "dataExchangeStatus"
  }, function (response) {
    for (var key in response) {
      if (response.hasOwnProperty(key)) {
        $('#' + key).bootstrapSwitch('state', response[key], true);
      }
    };
  });
}