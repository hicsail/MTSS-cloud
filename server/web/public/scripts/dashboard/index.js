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

function uploadFiles(elem) {  

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
});