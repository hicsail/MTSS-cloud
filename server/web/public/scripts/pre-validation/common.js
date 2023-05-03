function onclickPreValidation(fileId, fileName, preValidationNotCompleted) {

  $("#file-id").val(fileId);   
  $("#prevalidation-file-name").text(fileName);  
}

function savePreValidation(stepName) {
  
  const validStepNames = ['anonymization', 'dfShape', 'fieldsTypes', 'readmeSelection', 'variableLevel', 'uniqueIdentifier'];
  if (!validStepNames.includes(stepName)) {    
    errorAlert('step name is not valid');
  }
  else {    
    const fileId = $("#file-id").val();
    const payload = {};
    payload[stepName] = true;    
    $.ajax({      
      type: 'PUT',
      url: '/api/files/pre-validation/' + fileId, 
      contentType: 'application/json',   
      data: JSON.stringify(payload),                        
      success: function (result) {            
        let preValidationCompleted = true;
        for (const key in result.doc.preValidationSteps) {          
          if (!result.doc.preValidationSteps[key]) {            
            preValidationCompleted = false;
            break;
          }
        }        
        if (preValidationCompleted) {
          //$("#prevalidation-dropdown-link" + fileId).prop( "disabled", false );
          successAlert("You have completed all pre-validation steps and now you can proceed with validating your dataset.")
          //location.reload();
        }   
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });  
  }
}