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

function onclickFieldsTypesTab() {
  
  const fileId = $("#file-id").val(); 
  //hard coded for now 
  const fieldsTypes = [
          {
            'fieldType': 'ID',
            'num-cols': 3,
            'cols': ['col1', 'col2', 'col3'],
          },
          {
            'fieldType': 'Demographic',
            'num-cols': 2,
            'cols': ['col5', 'col6'],
          },
          {
            'fieldType': 'Wave-school-level',
            'num-cols': 1,
            'cols': ['col1'],
          },
          {
            'fieldType': 'Outcome',
            'num-cols': 2,
            'cols': ['col2', 'col3'],
          }
        ];

  let tableRowsHTML = '';
  
  //hard coded for now 
  const dataCols = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8'];

  for (const elem of fieldsTypes) {   
    const colsSelectHTML = getFieldsTypesColsSelectHTML(dataCols, elem['fieldType'], elem['cols']);
    tableRowsHTML += '<tr>' +                              
                    '<td>' + elem['fieldType'] + '</td>' +
                    '<td id="' + getFieldTypeColsNumCellId(elem['fieldType']) + '">' + elem['num-cols'] + '</td>' +              
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