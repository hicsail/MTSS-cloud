async function onclickDistributionVizTab(){  

  const fileId = getDataVizFileId();  
  const cols = await getColumns(fileId);      
  attachOptionsToSelectElem(cols, "data-dist-cols-select"); 
  $('#data-distribution-card .results').empty(); 
}

async function onchangeColDistSelect(elem) {

  const fileId = getDataVizFileId();  
  const column = $(elem).val();

  $.ajax({      
    type: 'PUT',
    url: '/api/files/viz/data_distribution/' + fileId, 
    contentType: 'application/json',   
    data: JSON.stringify({column: column}),                             
    success: function (result) {                         
      const imageNames = result['imageNames'].replace(/\[|\]/g,'')
                  .split(',')
                  .map(str => str.replace(/"/g, '').replace(/'/g, "").trim())
                  .filter(str => str !== '');
      $('#data-distribution-card .results').empty();      
      for (const name of imageNames) {
        $('#data-distribution-card .results').append('<div class="row">' + 
                                '<div class="col-md-2"></div>' + 
                                '<div class="col-md-8">' + 
                                  '<img src="/public/viz/' + fileId + '/' + name + '" alt="' + name +  '" style="width:100%;">' + 
                                '</div>' + 
                                '<div class="col-md-2"></div>' + 
                              '</div>');    
      }  
    },                  
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  }); 

}