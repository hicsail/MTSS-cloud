async function onclickPreValidation(fileId, fileName, preValidationNotCompleted) {

  $("#file-id").val(fileId);   
  $("#prevalidation-file-name").text(fileName); 
  $('#pre-validation-tabs a:first').click(); //to always open the first tab 
  const anonymization = await anonymizationIsCompleted(fileId);   
  if (anonymization) {  
    await enablePreValidationTabs(fileId); 
  }
  else {
    await disablePreValidationTabs(fileId, [2,3,4,5]);
  }  
}

async function getColumns(fileId) {

  const url = '/api/files/columns/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['columns'];
}

async function anonymizationIsCompleted(fileId) {

  const url = '/api/files/anonymization/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['anonymization'];
}

function attachOptionsToSelectElem(cols, selectId) {

  $("#"+ selectId).empty();
  for (const col of cols) {    
    $("#"+ selectId).append('<option value="' + col + '">' + col + '</option>');
  }
  $("#"+ selectId).selectpicker("refresh");
}

function savePreValidation(stepName, successAction=null) {
  
  const validStepNames = ['anonymization', 'dfType', 'fieldsTypes', 'readmeSelection',
                         'variablesHierarchy', 'uniqueIdentifier', 'columnCheck', 'anonymizationOnReq'];
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
        if (successAction){      
          successAction();
        }         
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });  
  }
}

$('#pre-validation-tabs a').click(function(){
  if ($(this).hasClass('disabled')) {    
    return false;
  }
  $(this).tab('show')
  let name = $(this).attr('href').substr(1)
  $('#pre-validation-tab-content').children().each(function(el) {    
    if (name === $(this).attr('id')) {
      $(this).addClass('active')
    } else {
      $(this).removeClass('active')
    }
  })  
})

$('#files-tabs a').click(function(){
  $(this).tab('show')
  let name = $(this).attr('href').substr(1)
  $('#files-tabs-content').children().each(function(el) {    
    if (name === $(this).attr('id')) {
      $(this).addClass('active')
    } else {
      $(this).removeClass('active')
    }
  }) 
})
