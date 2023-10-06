async function onclickDataVisualization(fileId, fileName) {

  $("#data-viz-file-id").val(fileId);   
  $("#visualization-file-name").text(fileName); 
  $('#data-viz-tabs a:first').click(); //to always open the first tab   
}

async function getColumns(fileId) {

  const url = '/api/files/columns/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['columns'];
}

function getDataVizFileId() {

  const fileId = $("#data-viz-file-id").val();
  return fileId;
}


$('#data-viz-tabs a').click(function(){
  $(this).tab('show')
  var name = $(this).attr('href').substr(1)
  $('#data-viz-tab-content').children().each(function(el) {    
    if (name === $(this).attr('id')) {
      $(this).addClass('active')
    } else {
      $(this).removeClass('active')
    }
  })  
})