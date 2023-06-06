
async function getReadmesUploadedByUser(userId) {

	const url = '/api/files/readmes/' + userId;
	const response = await fetch(url);
	const result = await response.json();
	return result['files'];
}

async function getSelectedReadme(fileId) {

	const url = '/api/files/readme/' + fileId;
	const response = await fetch(url);
	const result = await response.json();
	return result['readmeId'];
}

function attachOptionsToReadmeSelect(selectId, options, selectedReadme) {
	
	$("#" + selectId).empty();	
	$.each(options, function (i, option) {		
      $('#' + selectId).append($('<option>', { 
        value: option._id.toString(),
        text : option.name 
      }));
	});
	
	$("#" + selectId).selectpicker('val', selectedReadme)
	$("#" + selectId).val(selectedReadme).selectpicker("refresh");
	$("#" + selectId).selectpicker("refresh");		
}

async function onclickReadmeSelectionTab(userId) {
	
	const fileId = $("#file-id").val();
	const readmes = await getReadmesUploadedByUser(userId);	
	const readmeId = await getSelectedReadme(fileId);	
	attachOptionsToReadmeSelect('readme-select', readmes, readmeId);
}

async function onclickReadmeSelect(userId, readmeId) {

	const readmes = await getReadmesUploadedByUser(userId);	
	attachOptionsToReadmeSelect('readme-select', readmes);
}

function onclickUploadReadme(elem) {

	$("#readme-file-input").click();
}

function uploadFile(elem) {

  const fileName = $(elem).prop("files")[0]['name'];
  attachFiles(elem, 'readme', () => { readmeUploadSuccessCallback(fileName) });  
}

function readmeUploadSuccessCallback(fileName) { 
  
  $("#readme-card-text").text("")
  $("#readme-select").prepend("<option value='" + fileName + "' data-subtext='Uploaded by arezoo'>" + fileName + "</option>"); 
  $("#readme-select").val(fileName); 
  $("#readme-select").selectpicker("refresh").trigger('change');
}

function saveReadmeSelection(fileId, readmeId) {  
    
    $.ajax({      
      type: 'PUT',
      url: '/api/files/readme-selection/' + fileId, 
      contentType: 'application/json',   
      data: JSON.stringify({readmeId: readmeId}),                        
      success: function (result) {      	       
      	successAlert("Successfuly saved readme file for the file!");	
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });  
}

function onclickSaveReadmeSelection() {

	const fileId = $("#file-id").val();	
	const readmeId = $("#readme-select").val();	
	savePreValidation('readmeSelection', () => { saveReadmeSelection(fileId, readmeId) });
}