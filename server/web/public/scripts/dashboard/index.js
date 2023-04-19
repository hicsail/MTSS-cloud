
function onclickPreValidation(fileId, preValidationNotCompleted) {

  console.log("preValidationNotCompleted", preValidationNotCompleted)
  $("#file-id").val(fileId);
  if (preValidationNotCompleted === true) {
    $("#final-prevalidation-submit").prop( "disabled", true );  
  }
  else {
    $("#final-prevalidation-submit").prop( "disabled", false ); 
  }
}

function savePreValidation(stepName) {
  
  const validStepNames = ['anonymization', 'dfShape', 'fieldsTypes', 'readmeSelection', 'variableLevel'];
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
        console.log(result.doc);
        let preValidationCompleted = true;
        for (const key in result.doc.preValidationSteps) {          
          if (!result.doc.preValidationSteps[key]) {            
            preValidationCompleted = false;
            break;
          }
        }        
        if (preValidationCompleted) {
          $("#final-prevalidation-submit").prop( "disabled", false );
        }             
        //location.reload();   
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });  
  }
}

function uploadFile(elem) {

  const file = $(elem).prop("files")[0]; 
  $("#readme-card-text").text("")
  $("#readme-select").prepend("<option value='" + file['name'] + "' data-subtext='Uploaded by arezoo'>" + file['name'] + "</option>"); 
  $("#readme-select").val(file['name']); 
  $("#readme-select").selectpicker("refresh").trigger('change');  
}

function onchangeVariableLevelCB(elem) {

  console.log("place holder")

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

function onchangeFieldTypeCB(elem, event) {

  event.preventDefault();
  const type = $(elem).val();
  if ($(elem).is(":checked")) {
    $("#fields-type-table tbody").append("<tr><td>" + type + "</td><td>unknown</td></tr>");
  }
  else {    
    $("#fields-type-table tbody tr").each(function( index ) { 
      if ($(this).html().includes(type)) {
        $(this).remove();  
      }       
    });    
  }
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

function onkeydownFieldType(event, elem) {
  
  if(event.keyCode == 13) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const type = $(elem).val();
    $("#fields-type-dropdown-menu form").prepend('<div class="form-check ml-4">' +
                                              '<input type="checkbox" class="form-check-input" id="' + type + '" checked onchange="onchangeFieldTypeCB(this, event)" value="' + type + '">' +
                                              '<label class="form-check-label" for="' + type + '">' +
                                              type + 
                                              '</label>' + 
                                              '</div>');
    $("#fields-type-table tbody").append("<tr><td>" + type + "</td><td>unknown</td></tr>");
    return false;
  }
}

function attachFiles(elem) {
  
  const files = $(elem).prop("files");  

  $("#progressStatusCard").show();
  $("#progressStatus").empty();

  const AJAXCalls = [];  
  filesPayload = [];
  
  //upload and trasnfer files to the server separately 
  for (let i = 0; i < files.length; ++i) {

    const file = files[i];     

    let formData = new FormData();       
    formData.append('file', file);

    filesPayload.push({'name': file['name'], 'size': file['size']});    
      
    $("#progressStatus").append("<br><p id='progressBarTitle" + i + "'>" + file['name'] + "</p>"); 
    $("#progressStatus").append("<div id='progressBar" + i + "' class='progressBar'></div>");

    const call = $.ajax({
      xhr: function() { //Upload progress
        let xhr = new window.XMLHttpRequest();        
        xhr.upload.addEventListener("progress", function(evt){
          if (evt.lengthComputable) {
            const percentComplete = (evt.loaded / evt.total) * 100;           
            $("#progressBar" + i).width(percentComplete + '%');
            $("#progressBarTitle" + i).empty().text(file['name'] + ': ' + percentComplete + '%');          
          }
        }, false);
        return xhr;      
      },
      type: 'POST',
      url: '/api/S3/saveFilesToBucket',    
      data: formData, 
      contentType: false,
      cache: false,
      processData: false,     
      success: function (result) {                   
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    }); 
    AJAXCalls.push(call);     
  }

  Promise.all(AJAXCalls).then(AJAXCallsResults => {    
    
    const uploadedFiles = AJAXCallsResults.map(res => res.fileName);
    const failedUploads = filesPayload.filter(file => !uploadedFiles.includes(file.name))
                                      .map(file => file.name);   
    filesPayload = filesPayload.filter(file => uploadedFiles.includes(file.name));

    if (failedUploads.length > 0) { 
      errorAlert("unable to upload files " + failedUploads.join(', ') + '.'); 
    }
    if (filesPayload.length > 0) { //only update DB, if there has been a file ssuccesfully uploaded
      $.ajax({      
        type: 'POST',
        url: '/api/files/insertMany', 
        contentType: 'application/json',   
        data: JSON.stringify(filesPayload),                        
        success: function (result) {         
          location.reload();   
        },
        error: function (result) {
          errorAlert(result.responseJSON.message);
        }
      });
    }       
  });  
}

function onclickUpload(elem) {  

  $(elem).siblings("input").click();
}

function deleteFile() {

  const fileName = $("#file-name").val();  
  const fileObjectId = $("#file-object-id").val();

  $.ajax({      
    type: 'DELETE',
    url: '/api/S3/deleteFile/' + fileName,                                 
    success: function (result) { 
      //Also delete from DB     
      $.ajax({      
        type: 'DELETE',
        url: '/api/files/' + fileObjectId,                                 
        success: function (result) {                     
          successAlert("Successfully deleted file.");
          location.reload();           
        },
        error: function (result) {
          errorAlert(result.responseJSON.message);
        }
      });          
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function onClickDeleteFile(fileName, fileObjectId) {

  $("#modal-title").text('Delete file ' + fileName);
  $("#file-name").val(fileName);
  $("#file-object-id").val(fileObjectId);
}

$(document).ready(function () {

  $('.close-icon').on('click',function() {
    $(this).closest('.card').fadeOut();
  })

  const table = $('.table').DataTable({           
    scrollX: true,
    scrollY: '500px',
    scrollCollapse: true,
    lengthChange: false,          
    stateSave: true,
    dom: 'Bfrtip',
    columnDefs: [
      {
        type: 'size',
        "sType": "size",
        "bSortable": true,
        targets: 4,
      },
    ],
    buttons: [
      {
        extend: 'print',
        exportOptions: {
          columns: ':visible'
        },
        text: '<i class="fa fa-print"></i> Print',              
        footer: true,
        autoPrint: true,
        orientation : 'landscape',
        paperSize : 'A3',         
      },
      {
        extend: 'copyHtml5',
        exportOptions: {
          columns: ':visible'
        }
      },
      {
        extend: 'excelHtml5',
        exportOptions: {
          columns: ':visible'
        }
      },
      {
        extend: 'pdfHtml5',
        exportOptions: {
          columns: ':visible'
        },
        orientation : 'landscape',
        pageSize : 'A3',
        text : '<i class="fa fa-file-pdf-o"> PDF</i>',
        titleAttr : 'PDF'
      },            
      {
        extend: 'csvHtml5',
        exportOptions: {
          columns: ':visible'
        }
      },
      'colvis'
    ]          
  }); 
  table.columns( '.hidden' ).visible( false );

  jQuery.fn.dataTableExt.oSort["size-desc"] = function (x, y) {
    
    const REMOVABLE = ['<span class="badge badge-info">', "</span>"];
    const SIZE_LETTERS = ['kB', 'MB', 'GB', 'TB'];
    for (const str of REMOVABLE) {
      if (x.includes(str)) {
        x = x.replace(str, '');
      }
      if (y.includes(str)) {
        y = y.replace(str, '');
      }
    }
    const xSizeLetterIndex = SIZE_LETTERS.indexOf(x.substring(x.length-2, x.length));
    const ySizeLetterIndex = SIZE_LETTERS.indexOf(y.substring(y.length-2, y.length));        
    
    if (xSizeLetterIndex === ySizeLetterIndex) {
      let xSubStrIdx2 = 2;
      let ySubStrIdx2 = 2;
      if (xSizeLetterIndex === -1) {
        xSubStrIdx2 = 1
      }
      if (ySizeLetterIndex === -1) {
        ySubStrIdx2 = 1
      }
      x = x.substring(0, x.length - xSubStrIdx2);
      y = y.substring(0, y.length - ySubStrIdx2);

      return (parseFloat(x) < parseFloat(y) ? 1 : ((parseFloat(x) > parseFloat(y)) ? -1 : 0));  
    }
    else {
      return (xSizeLetterIndex < ySizeLetterIndex) ? 1 : ((xSizeLetterIndex > ySizeLetterIndex) ? -1 : 0);       
    }   
  };
     
  jQuery.fn.dataTableExt.oSort["size-asc"] = function (x, y) {
    
    const REMOVABLE = ['<span class="badge badge-info">', "</span>"];
    const SIZE_LETTERS = ['kB', 'MB', 'GB', 'TB'];
    for (const str of REMOVABLE) {
      if (x.includes(str)) {
        x = x.replace(str, '');
      }
      if (y.includes(str)) {
        y = y.replace(str, '');
      }
    }
    const xSizeLetterIndex = SIZE_LETTERS.indexOf(x.substring(x.length-2, x.length));
    const ySizeLetterIndex = SIZE_LETTERS.indexOf(y.substring(y.length-2, y.length));

    if (xSizeLetterIndex === ySizeLetterIndex) {
      let xSubStrIdx2 = 2;
      let ySubStrIdx2 = 2;
      if (xSizeLetterIndex === -1) {
        xSubStrIdx2 = 1
      }
      if (ySizeLetterIndex === -1) {
        ySubStrIdx2 = 1
      }
      x = x.substring(0, x.length - xSubStrIdx2);
      y = y.substring(0, y.length - ySubStrIdx2);

      return (parseFloat(x) < parseFloat(y) ? -1 : ((parseFloat(x) > parseFloat(y)) ? 1 : 0));  
    }
    else {
      return (xSizeLetterIndex < ySizeLetterIndex) ? -1 : ((xSizeLetterIndex > ySizeLetterIndex) ? 1 : 0);       
    }      
  }     
});