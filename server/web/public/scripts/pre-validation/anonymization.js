async function getUniqueIdentifier(fileId) {

  const url = '/api/files/unique-identifier/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['uniqueIdentifier'];
}

async function getHIPAAColumns(fileId) {

  const url = '/api/files/anonymization/column-check/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  const columns = result['columns'].replace(/\[|\]/g,'')
                  .split(',')
                  .map(str => str.replace(/"/g, '').replace(/'/g, "").trim())
                  .filter(str => str !== '');
  return columns;
}

async function onclickAnonymizationTab() {

  const fileId = $("#file-id").val();  
  const uniqueIdentifier = await getUniqueIdentifier(fileId);
  const HIPAAColumns = await getHIPAAColumns(fileId);
  const selectId = 'unique-identifier-select'; 
  const removeIdentifyingSelectId = 'remove-identifying-cols-select';
  const identifiedHipaaDivId = 'identifying-cols-list'; 
  const cols = await getColumns(fileId);

  attachOptionsToSelectElem(cols, selectId);
  $("#" + selectId).selectpicker('val', uniqueIdentifier)
  $("#" + selectId).val(uniqueIdentifier).selectpicker("refresh");
  $("#" + selectId).selectpicker("refresh");

  attachOptionsToSelectElem(cols, removeIdentifyingSelectId);
  attachOptionsToSelectElem(cols, 'anonymization-on-req-column');    

  $("#" + identifiedHipaaDivId).empty();
  for (const col of HIPAAColumns) {
    $("#" + identifiedHipaaDivId).append("<p>" + col + "</p>");
  }
}

function onclickAddAnonimizationOnReqCol() {

  const selectDomIds = ['anonymization-on-req-column', 
                        'anonymization-on-req-type', 
                        'anonymization-on-req-mode'];

  const col = $("#anonymization-on-req-column").val();
  const type = $("#anonymization-on-req-type").val();
  const mode = $("#anonymization-on-req-mode").val();

  $("#anonymization-on-req-table tbody").append("<tr><td>" + col + "</td>" + 
                                          "<td>" + type + "</td>" + 
                                          "<td>" + mode + "</td>" +
                                          "</tr>");
  for (const id of selectDomIds) {
    $("#" + id).val("");
    $("#" + id).selectpicker("refresh")
  }
}

function onclickAnonymizationOnReqSave() {

  const fileId = $("#file-id").val();
  const tableId = 'anonymization-on-req-table';
  const anonymizationRequests = anonymizationColsFromTable(tableId);  

  $.ajax({      
    type: 'PUT',
    url: '/api/files/anonymization-on-request/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({anonymizationRequests: anonymizationRequests}),                        
    success: function (result) {               
      successAlert("Successfuly anonymized selected columns and saved file!");  
      onclickAnonymizationTab();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  }); 
}

function anonymizationColsFromTable(tableId) {

  let anonymizationCols = [];
  let rows = $("#" + tableId + " tbody").find('tr');  
  rows.each(function() {       
    let cols = $(this).find('td'); 
    let elem = {};    
    cols.each(function(idx) { 
      if (idx === 0) {        
        elem['key'] = $(this).text();  
      }
      else if (idx === 1) {               
        elem['type'] = $(this).text(); 
      }
      else if (idx === 2) {
        elem['mode'] = $(this).text();   
      }
    });        
    anonymizationCols.push(elem);
  });  
  return anonymizationCols; 
}

function saveUniqueIdentifier(fileId, uniqueIdentifier) {  
    
  $.ajax({      
    type: 'PUT',
    url: '/api/files/unique-identifier/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({uniqueIdentifier: uniqueIdentifier}),                        
    success: function (result) {               
      successAlert("Successfuly saved unique identifier for the file!");  
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });  
}

function onclickSaveRemovedCols() {

  const selectId = 'remove-identifying-cols-select'; 
  const fileId = $("#file-id").val();  
  const identifyingCols = $("#" + selectId).val(); 
  
  $.ajax({      
    type: 'PUT',
    url: '/api/files/remove-identifying-cols/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({identifyingCols: identifyingCols}),                        
    success: function (result) {               
      successAlert("Successfuly removed selected columns for the file!");  
      onclickAnonymizationTab();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });  
}

function onclickSaveUniqueIdentifier() {

  const selectId = 'unique-identifier-select'; 
  const fileId = $("#file-id").val();  
  const uniqueIdentifier = $("#" + selectId).val();  
  savePreValidation('uniqueIdentifier', 
                    () => { 
                      saveUniqueIdentifier(fileId, uniqueIdentifier)
                    });
}

function onclickIdentifyingColUserRadio(elem) {

  $('.collapse').collapse('hide');
  $('#' + $(elem).attr('aria-controls')).collapse('show');
}

function onchangeIdentifyingColCB(elem) {

  const colName = $(elem).val();
  if ($(elem).is(":checked")) {    
    $("#identifying-cols-list").append("<p>" + colName + "</p>");
  }
  else {
    $("#identifying-cols-list p").each(function( index ) { 
      if ($(this).text() === colName) {
        $(this).remove();  
      } 
    });   
  }
  
}

function onclickUploadEditedDF(elem) {

  $("#edited-file-input").click();
}

function onchangeEditedFileInput(elem) {

  const $fileId = 'file-id'; 

  function postUploadSuccessAction() {

    successAlert("File uploaded sucessfully!");    
  }  
  deleteFile($fileId, 
            () => { 
              attachFiles(elem, 'csv')
            });    
}