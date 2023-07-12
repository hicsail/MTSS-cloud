function getFieldsTypesColsSelectHTML(dataCols, fieldType, selectedCols=[]) {

  let colSelectHTML = '<select class="fields-types-cols-select"' + 
                        'onchange="onchangeFieldsTypesColsSelect(this,' +  "'" + fieldType + "'" + ')"' +
                        'data-live-search="true"' + 
                        'data-style="btn-white"' +  
                        'data-size="5"' +
                        'data-title="See Columns"' +
                        'data-selected-text-format="static"' +
                        ' multiple>';
  for (const col of dataCols) {
    const selected = selectedCols.includes(col) ? 'selected' : '';
    colSelectHTML += '<option ' +  selected + ' value="' + col + '">' + col + '</option>';  
  }    
  colSelectHTML += '</select>';
  return colSelectHTML;
}

function getFieldTypeColsNumCellId(type) {

  return 'num-cols-' + type.replace(' ', '-');
}

function onchangeFieldsTypesColsSelect(elem, fieldType) {

  const selectedCols = $(elem).val();
  const colsNumCellID = getFieldTypeColsNumCellId(fieldType);
  $("#" +  colsNumCellID).text(selectedCols.length);  
}

async function getFieldsTypes(fileId) {

  const url = '/api/files/fields-types/' + fileId;
  const response = await fetch(url);
  const result = await response.json();  
  return result['fieldsTypes'];
}

async function onclickFieldsTypesTab() {
  
  await initializeFieldTypesMenu();
  const fileId = $("#file-id").val(); 
  let fieldsTypes = await getFieldsTypes(fileId);  
  fieldsTypes = fieldsTypes ? fieldsTypes : [];
  
  let tableRowsHTML = '';
  
  //hard coded for now 
  const dataCols = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8'];

  for (const elem of fieldsTypes) {       
    const colsSelectHTML = getFieldsTypesColsSelectHTML(dataCols, elem['fieldType'], elem['cols']);
    tableRowsHTML += '<tr>' +                              
                    '<td>' + elem['fieldType'] + '</td>' +
                    '<td id="' + getFieldTypeColsNumCellId(elem['fieldType']) + '">' + elem['cols'].length + '</td>' +              
                    '<td>' + colsSelectHTML + '</td>' +
                  '</tr>'    
  }
  $("#fields-type-table-tbody").empty().append(tableRowsHTML);
  $('.fields-types-cols-select').selectpicker();
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
    //hard coded for now 
    const dataCols = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8'];
    const colsSelectHTML = getFieldsTypesColsSelectHTML(dataCols, type);
    $("#fields-type-table tbody").append("<tr><td>" + type + "</td>" + 
                                          "<td id='" + getFieldTypeColsNumCellId(type) + "'>0</td>" + 
                                          "<td>" + colsSelectHTML + "</td>" +
                                          "</tr>");
    $('.fields-types-cols-select').selectpicker();
    return false;
  }
}

async function initializeFieldTypesMenu() {

  let defaultFieldsTypesOptions = ['Demographic', ' Wave-school-level', 'Outcome', 'ID'];
  const domId = 'fields-type-dropdown-menu';
  const fileId = $("#file-id").val(); 

  let fieldsTypes = await getFieldsTypes(fileId);
  fieldsTypes = fieldsTypes ? fieldsTypes : [];
  fieldsTypes = fieldsTypes.map((elem) => { return {'type': elem['fieldType'], 'checked': true}});
  console.log("deli", fieldsTypes)
  for (const type of defaultFieldsTypesOptions) {
    if (!fieldsTypes.find(elem => elem['type'] === type)) {
      fieldsTypes.push({'type': type, 'checked': false});  
    }
  }

  let html = '<form class="px-4 py-3">';
  for (const elem of fieldsTypes) {
    const checked = elem['checked'] ? 'checked' : '';
    html += '<div class="form-check ml-4">' +
              '<input type="checkbox" class="form-check-input" id="' + elem['type'] + '" value="' + elem['type'] + '" onchange="onchangeFieldTypeCB(this, event)" ' + checked + '>' + 
              '<label class="form-check-label" for="' + elem['type'] + '">' + elem['type'] + '</label>' + 
            '</div>';
  }
  html += '</form>';

  $("#" + domId).append(html);
}

function onchangeFieldTypeCB(elem, event) {

  event.preventDefault();
  const type = $(elem).val();
  if ($(elem).is(":checked")) {    
    const dataCols = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8'];
    const colsSelectHTML = getFieldsTypesColsSelectHTML(dataCols, type);
    $("#fields-type-table tbody").append("<tr><td>" + type + "</td>" + 
                                          "<td id='" + getFieldTypeColsNumCellId(type) + "'>0</td>" + 
                                          "<td>" + colsSelectHTML + "</td>" +
                                          "</tr>");
    $('.fields-types-cols-select').selectpicker();
  }
  else {    
    $("#fields-type-table tbody tr").each(function( index ) { 
      if ($(this).html().includes(type)) {
        $(this).remove();  
      }       
    });    
  }
}

function getFieldsTypesFromTable(tableId) {

  let fieldsTypes = [];
  let rows = $("#" + tableId + " tbody").find('tr');  
  rows.each(function() {       
    let cols = $(this).find('td'); 
    let fieldType = {};    
    cols.each(function(idx) { 
      if (idx === 0) {        
        fieldType['fieldType'] = $(this).text();  
      }
      else if (idx === 2) {               
        fieldType['cols'] = $(this).find('select').val(); 
      }
    });        
    fieldsTypes.push(fieldType);
  });  
  return fieldsTypes; 
}

function saveFieldsTypes(fileId, fieldsTypes) {  
    
    $.ajax({      
      type: 'PUT',
      url: '/api/files/fields-types/' + fileId, 
      contentType: 'application/json',   
      data: JSON.stringify(fieldsTypes),                        
      success: function (result) {               
        successAlert("Successfuly saved fields types for the file!");  
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });  
}

function onclickSaveFieldsTypes() {

  const fileId = $("#file-id").val(); 
  const tableId = "fields-type-table";
  let fieldsTypes = getFieldsTypesFromTable(tableId);  
  savePreValidation('fieldsTypes', () => { saveFieldsTypes(fileId, fieldsTypes) });
}