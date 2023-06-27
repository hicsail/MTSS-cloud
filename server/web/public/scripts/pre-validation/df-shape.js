async function getDFType(fileId) {

  const url = '/api/files/dfType/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['dfType'];
}

async function onclickDFShapeTab() {

  const fileId = $("#file-id").val();
  const dfType = await getDFType(fileId);

  const selectId = 'df-type-select';
  $("#" + selectId).selectpicker('val', dfType)
  $("#" + selectId).val(dfType).selectpicker("refresh");
  $("#" + selectId).selectpicker("refresh");  
}

function saveDFType(fileId, dfType) {  
   
  $.ajax({      
    type: 'PUT',
    url: '/api/files/dfType/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({dfType: dfType}),                        
    success: function (result) {               
      successAlert("Successfuly saved DF type for the file!");  
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });  
}

function onclickSaveDFType() {

  const selectId = 'df-type-select'; 
  const fileId = $("#file-id").val();  
  const dfType = $("#" + selectId).val(); 
  savePreValidation('dfType', () => { saveDFType(fileId, dfType) });
}