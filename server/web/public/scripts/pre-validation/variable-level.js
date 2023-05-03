function onchangeVariableLevelCB(elem) {

  console.log("place holder")

}

function onkeydownVariableLevel(even, elem) {

  if(event.keyCode == 13) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const value = $(elem).val();
    $("#variable-level-dropdown-menu form").prepend('<div class="form-check ml-4">' +
                                              '<input type="checkbox" class="form-check-input" id="' + value + '" checked onchange="onchangeFieldTypeCB(this, event)" value="' + value + '">' +
                                              '<label class="form-check-label" for="' + value + '">' +
                                              value + 
                                              '</label>' + 
                                              '</div>');    
    return false;
  }

}