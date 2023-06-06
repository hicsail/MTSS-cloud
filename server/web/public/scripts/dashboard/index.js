function attachFiles(elem, fileType=null, successAction=null) {
  
  const files = $(elem).prop("files");
  const type = fileType ? fileType : $("#file-type").val();   

  $("#progressStatusCard").show();
  $("#progressStatus").empty();

  const AJAXCalls = [];  
  filesPayload = [];
  
  //upload and trasnfer files to the server separately 
  for (let i = 0; i < files.length; ++i) {

    const file = files[i];     

    let formData = new FormData();       
    formData.append('file', file);

    filesPayload.push({'name': file['name'], 'size': file['size'], 'type': type});    
      
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
      url: '/api/S3/saveFilesToBucket/' + type,    
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
          if (successAction) {            
            successAction();
          }
          else {
            location.reload();  
          }             
        },
        error: function (result) {
          errorAlert(result.responseJSON.message);
        }
      });
    }       
  });  
}

function uploadFiles(type) {

  const validTypes = ['csv', 'video', 'image'];
  const typeToExtension = {
    'csv' :'.csv'
  };
  const $fileInputID = 'file-input';

  if (!validTypes.includes(type)) {
    errorAlert('Data type is not valid!');  
  }
  $("#file-input").prop('accept', '');
  if (type in typeToExtension) {    
    $("#" + $fileInputID).prop('accept', typeToExtension[type]);  
  }
  $("#file-type").val(type);  
  $("#file-input").click();
}

function deleteFile() {

  const fileName = $("#file-name").val();  
  const fileObjectId = $("#file-object-id").val();
  const fileType = $("#file-type").val();

  $.ajax({      
    type: 'DELETE',
    url: '/api/S3/deleteFile/' + fileName + '/' + fileType,                                 
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

function onClickDeleteFile(fileName, fileObjectId, type) {

  $("#modal-title").text('Delete file ' + fileName);
  $("#file-name").val(fileName);
  $("#file-object-id").val(fileObjectId);
  $("#file-type").val(type);
}

//-------------------------------------------------------------------------------

$(document).ready(function () {

  $('.close-icon').on('click',function() {
    $(this).closest('.card').fadeOut();
  })

  const table = $('#files-list-table').DataTable({           
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