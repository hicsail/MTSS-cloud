
async function getFileContent(fileId) {
  
  const url = '/api/files/content/' + fileId;
  const response = await fetch(url);
  const result = await response.json();
  return result['content'];
}

function convertDataToTable(data, fileName=null) {
     
  let result = {'header': [], 'body': []};
  let delimiter = ',';  
  if (fileName) {
    const fileExt = fileName.split('.').pop();
    if (fileExt === 'csv') {
      delimiter = ',';
    }
    else if (fileExt === 'tsv') {
      delimiter = '\t';
    } 
  }    
  const rows = data.split("\n");
  result['header'] = rows[0].split(delimiter);
  rows.shift();
  for (const row of rows) {
    if (row) {
      result['body'].push(row.split(delimiter));  
    }    
  }  
  let headerHTML = "<thead><tr>";
  let bodyHTML = "<tbody>"; 
  for (const val of result['header']) {
    headerHTML += "<th>" + val + "</th>";
  }
  headerHTML += "</thead></tr>";
  for (let j = 0; j < result['body'].length; ++j){
    const row = result['body'][j];    
    bodyHTML += "<tr>";
    for (let i = 0; i < result['header'].length; ++i) {
      const cellVal = i < row.length ? row[i] : '';      
      bodyHTML += "<td>" + cellVal + "</td>";                  
    }
    bodyHTML += "</tr>";
  }
  bodyHTML += "</tbody>";
  return "<table class='table table-striped table-bordered'>" + headerHTML + bodyHTML + "</table>";
}

async function attachDatasetToPreview(fileId) {

  const data = await getFileContent(fileId);
  const htmlTable = convertDataToTable(data);
  $("#dataset-preview .card-body").empty().append(htmlTable);
}

async function onclickDatasetPreviewTab() {

  const fileId = $("#file-id").val();  
  await attachDatasetToPreview(fileId);  
}