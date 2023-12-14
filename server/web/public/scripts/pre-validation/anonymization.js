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

async function getAnonymizationFlags(fileId) {

  const url = '/api/files/anonymization-flags/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result;
}

function onchangeIdentifyingColSelect(elem) {

  const btnId = 'save-removed-columns-btn';
  if ($(elem).val().length > 0) {
    $("#" + btnId).removeClass('d-none');    
  }
  else {
    $("#" + btnId).addClass('d-none');
  }
}

function onchangeUniqueIdentifierSelect(elem) {

  const btnId = 'save-unique-identifier-btn';
  if ($(elem).val()) {
    $("#" + btnId).removeClass('d-none');    
  }
  else {
    $("#" + btnId).addClass('d-none');
  }
}

async function onclickAnonymizationTab() {

  const fileId = $("#file-id").val();  
  const uniqueIdentifier = await getUniqueIdentifier(fileId);
  const HIPAAColumns = await getHIPAAColumns(fileId);
  const anonymizationFlags = await getAnonymizationFlags(fileId);
  const selectId = 'unique-identifier-select'; 
  const removeIdentifyingSelectId = 'remove-identifying-cols-select';
  const identifiedHipaaDivId = 'identifying-cols-list'; 
  const submitButtonId = 'submit-anonymization-btn';
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
  if (anonymizationFlags['columnCheck'] || 
      anonymizationFlags['anonymizationOnReq'] || 
      anonymizationFlags['uniqueIdentifier']
      ) 
  {
    enableBtn(submitButtonId);    
    $("#anonymization-required").click();
  }
  else {    
    disableBtn(submitButtonId);
    $("#no-anonymization").click();
  }
}

function onclickAddAnonimizationOnReqCol() {

  const saveBtnId = 'save-anonymization-on-req-btn';
  const selectDomIds = ['anonymization-on-req-column', 
                        'anonymization-on-req-type', 
                        'anonymization-on-req-mode'];

  const col = $("#anonymization-on-req-column").val();
  const type = $("#anonymization-on-req-type").val();
  const mode = $("#anonymization-on-req-mode").val();

  if (!col || !type || !mode) {
    errorAlert("You must select a column, type and mode!");
    return;
  }

  $("#anonymization-on-req-table tbody").append("<tr><td>" + col + "</td>" + 
                                          "<td>" + type + "</td>" + 
                                          "<td>" + mode + "</td>" +
                                          "</tr>");
  for (const id of selectDomIds) {
    $("#" + id).val("");
    $("#" + id).selectpicker("refresh")
  }

  if (col && type && mode) {
    $("#" + saveBtnId).removeClass('d-none');
  }
}

function onclickAnonymizationOnReqSave() {

  const fileId = $("#file-id").val();
  const tableId = 'anonymization-on-req-table';
  const submitButtonId = "submit-anonymization-btn";
  const anonymizationRequests = anonymizationColsFromTable(tableId);  

  $.ajax({      
    type: 'PUT',
    url: '/api/files/anonymization-on-request/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({anonymizationRequests: anonymizationRequests}),                        
    success: function (result) {                     
      savePreValidation('anonymizationOnReq', 
                    () => { 
                      successAlert("Successfuly removed selected columns for the file!");  
                      onclickAnonymizationTab();
                      enableBtn(submitButtonId);
                    });

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
  const submitButtonId = "submit-anonymization-btn";
  const fileId = $("#file-id").val();  
  const identifyingCols = $("#" + selectId).val(); 
  
  $.ajax({      
    type: 'PUT',
    url: '/api/files/remove-identifying-cols/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({identifyingCols: identifyingCols}),                        
    success: function (result) {                     
      savePreValidation('columnCheck', 
                    () => { 
                      successAlert("Successfuly removed selected columns for the file!");  
                      onclickAnonymizationTab();
                      enableBtn(submitButtonId);
                    });
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });  
}

function onclickSaveUniqueIdentifier() {

  const selectId = 'unique-identifier-select';
  const submitButtonId = "submit-anonymization-btn"; 
  const fileId = $("#file-id").val();  
  const uniqueIdentifier = $("#" + selectId).val();  
  savePreValidation('uniqueIdentifier', 
                    () => { 
                      saveUniqueIdentifier(fileId, uniqueIdentifier);
                      enableBtn(submitButtonId);
                    });
}

function onclickUploadEditedDSRadio(elem) {

  onclickRadioCollapse(elem);
  //const uploadBtn = 'upload-edited-ds-btn';
  const removeColsBtn = 'save-removed-columns-btn';  
  $("#" + removeColsBtn).addClass('d-none'); 
}

function onclickRemoveColsRadio(elem) {

  onclickRadioCollapse(elem);
  const uploadBtn = 'upload-edited-ds-btn';
  const selectId = 'remove-identifying-cols-select';
  const removeColsBtn = 'save-removed-columns-btn'; 

  $("#" + uploadBtn).addClass('d-none');
  if ($("#" + selectId).val().length > 0) {
    $("#" + removeColsBtn).removeClass('d-none');    
  }
  else {
    $("#" + removeColsBtn).addClass('d-none');
  } 
}

function onclickRadioCollapse(elem) {

  $(elem).closest('.radio-containers').find('.collapse').each(function(){     
    $(this).collapse('hide');
  });
  $('#' + $(elem).attr('aria-controls')).collapse('show');
}

function enableBtn(domId) {

  $("#" + domId).prop("disabled", false);  
}

function disableBtn(domId) {

  $("#" + domId).prop("disabled", true);
}

function onclickNoAnonymizationRadio(elem) {
  
  const submitButtonId = "submit-anonymization-btn";
  onclickRadioCollapse(elem);
  enableBtn(submitButtonId);
}

async function onclickAnonymizationRequiredRadio(elem) {

  const fileId = $("#file-id").val();
  const submitButtonId = "submit-anonymization-btn";
  onclickRadioCollapse(elem);
  const anonymizationFlags = await getAnonymizationFlags(fileId);
  if (anonymizationFlags['columnCheck'] || 
      anonymizationFlags['anonymizationOnReq'] || 
      anonymizationFlags['uniqueIdentifier']
      ) {
    enableBtn(submitButtonId);
  }
  else {
    disableBtn(submitButtonId);  
  }  
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

  const uploadBtnId = 'upload-edited-ds-btn';
  const files = $(elem).prop("files");
  if (files.length > 0) {
    $("#" + uploadBtnId).removeClass('d-none');
  }
  else {
    $("#" + uploadBtnId).addClass('d-none');  
  }

  /*const $fileId = 'file-id'; 

  function postUploadSuccessAction() {

    successAlert("File uploaded sucessfully!");    
  }  
  deleteFile($fileId, 
            () => { 
              attachFiles(elem, 'csv');
            }); */   
}

function onclickSaveEditedDF(elem) {

  const $fileId = 'file-id';
  const fileInputElem =  $("#edited-file-input");  

  function postUploadSuccessAction() {

    savePreValidation('columnCheck', 
                    () => { 
                      successAlert("Successfuly uploaded edited dataset and replaced it with original one!");  
                      onclickAnonymizationTab();      
                    });   
  }  
  
  deleteFile($fileId, 
            () => { 
              attachFiles(fileInputElem, 'csv', postUploadSuccessAction);

            });    
}

async function enablePreValidationTabs(fileId) {
      
  $('#pre-validation-tabs a').each(function(){
    if ($(this).hasClass('disabled')) {
      $(this).removeClass('disabled');  
    }
  });      
}

async function disablePreValidationTabs(fileId, idxList=null) {
  
  $('#pre-validation-tabs a').each(function(idx, val){ 
    if ( (idxList && idxList.includes(idx)) || !idxList ) {
      $(this).addClass('disabled'); 
    }                   
  });  
}

async function onclickSubmitAnonymization() {
   
  const fileId = $("#file-id").val(); 
  const anonymization = await anonymizationIsCompleted(fileId); 
  savePreValidation('anonymization', 
                    () => { 
                      if (anonymization) {
                        enablePreValidationTabs(fileId); 
                      }  
                    });
}