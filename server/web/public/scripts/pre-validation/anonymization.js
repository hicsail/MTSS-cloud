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

  attachOptionsToSelectElem(HIPAAColumns, removeIdentifyingSelectId);  

  $("#" + identifiedHipaaDivId).empty();
  for (const col of HIPAAColumns) {
    $("#" + identifiedHipaaDivId).append("<p>" + col + "</p>");
  }
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