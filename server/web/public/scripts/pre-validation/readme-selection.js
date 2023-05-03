function uploadFile(elem) {

  const file = $(elem).prop("files")[0]; 
  $("#readme-card-text").text("")
  $("#readme-select").prepend("<option value='" + file['name'] + "' data-subtext='Uploaded by arezoo'>" + file['name'] + "</option>"); 
  $("#readme-select").val(file['name']); 
  $("#readme-select").selectpicker("refresh").trigger('change');  
}