async function getUniqueIdentifier(fileId) {

  const url = '/api/files/unique-identifier/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['uniqueIdentifier'];
}

async function onclickAnonymizationTab() {

  const fileId = $("#file-id").val();
  const uniqueIdentifier = await getUniqueIdentifier(fileId);

  const selectId = 'unique-identifier-select';
  $("#" + selectId).selectpicker('val', uniqueIdentifier)
  $("#" + selectId).val(uniqueIdentifier).selectpicker("refresh");
  $("#" + selectId).selectpicker("refresh");  
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
  savePreValidation('uniqueIdentifier', () => { saveUniqueIdentifier(fileId, uniqueIdentifier) });
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
  deleteFile($fileId, () => { attachFiles(elem, 'csv')});    
}