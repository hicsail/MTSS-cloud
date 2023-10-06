async function onclickMissingDataVizTab() {

  const fileId = getDataVizFileId();  
  $.ajax({      
    type: 'PUT',
    url: '/api/files/viz/missing_data/' + fileId,                            
    success: function (result) {                         
      const imageNames = result['imageNames'].replace(/\[|\]/g,'')
                  .split(',')
                  .map(str => str.replace(/"/g, '').replace(/'/g, "").trim())
                  .filter(str => str !== '');
      $('.card-body').empty();
      for (const name of imageNames) {
        $('.card-body').append('<div class="row">' + 
                                '<div class="col">' + 
                                  '<img src="/public/viz/' + fileId + '/' + name + '" alt="' + name +  '" style="width:100%;">' + 
                                '</div>' + 
                              '</div>');    
      }          
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  }); 
}