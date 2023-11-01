async function onclickAnalyticsTab() {

  const fileId = getDataVizFileId();  
  $.ajax({      
    type: 'PUT',
    url: '/api/files/viz/analytics/' + fileId,                            
    success: function (result) {                         
      const imageNames = result['imageNames'].replace(/\[|\]/g,'')
                  .split(',')
                  .map(str => str.replace(/"/g, '').replace(/'/g, "").trim())
                  .filter(str => str !== '');
      $('#analytics-viz-card .card-body').empty();
      for (const name of imageNames) {
        $('#analytics-viz-card .card-body').append('<div class="row mt-2">' + 
                                '<div class="col">' + 
                                  '<p class="font-weight-bold text-center text-info">' + name.split(".png")[0] + '</p>' + 
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