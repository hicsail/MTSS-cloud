async function getDFType(fileId) {

  const url = '/api/files/dfType/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['dfType'];
}

async function getDFShapeAndParticipantId(fileId) {

  const url = '/api/files/dfShape/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return {shape: result['shape'], participantId: result['participantId']};
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

async function onclickDFShapeTab() {

  const fileId = $("#file-id").val();
  const selectId = 'participant-id-select';
  const cols = await getColumns(fileId);
  attachOptionsToSelectElem(cols, selectId);
  const {shape, participantId} = await getDFShapeAndParticipantId(fileId);  
  $("#" + selectId).selectpicker('val', participantId)
  $("#" + selectId).val(participantId).selectpicker("refresh");
  $("#" + selectId).selectpicker("refresh");
  if (shape) {
    $("#df-shape-result").empty().append("Based on the selected participant id, system has detected a " 
                                         + shape + " shape for the dataset.");  
  }  
}

function onchangeParticipantId(elem) {
  
  const participantId = $(elem).val();
  const fileId = $("#file-id").val(); 

  $.ajax({      
    type: 'PUT',
    url: '/api/files/dfShape/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({participantId: participantId}),                        
    success: function (result) {               
      //successAlert("Successfuly saved DF shape and participant id for the file!"); 
      $("#df-shape-result").empty().append("Based on the selected participant id, system has detected a " 
                                          + result['shape'] + " shape for the dataset."); 
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  }); 
}