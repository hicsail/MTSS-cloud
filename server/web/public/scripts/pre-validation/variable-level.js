let data; //global variable for hierarchy structure 

//////////////////////////////////////////////////////////////////////

async function getVariablesHierarchyFromDB(fileId) {

	const url = '/api/files/variables-hierarchy/' + fileId;
	const response = await fetch(url);
	const result = await response.json();
	return result['hierarchy'];
}

async function onclickVariableLevelsTab() {

	const fileId = $("#file-id").val();	
	data = await getVariablesHierarchyFromDB(fileId);
	clearSVG();	
	renderTreeLayout(data);
	renderPackedCircles(data);
	
	const addVars = ['var1', 'var2', 'var3', 'var4', 'var5', 'var6', 'var9', 'var10'];
	const removeVars = [];
	const parentVars = [];
	getVarsFromHierarchy(data, addVars, removeVars, parentVars);
	attachOptionsToSelectElem("variables-select", addVars);
	attachOptionsToSelectElem("remove-variable-select", removeVars, "remove-variable-col-wrapper");
	attachOptionsToSelectElem("variables-parent-select", parentVars, "variables-parent-col-wrapper");	
}

function getVarsFromHierarchy(hierarchy, addVars, removeVars, parentVars) {
	
	if (!hierarchy) {
		return; 
	}
	else {
		if (hierarchy['name']) {
			addVars.splice(addVars.indexOf(hierarchy['name']), 1);
			removeVars.push(hierarchy['name']);
			parentVars.push(hierarchy['name']);
		}
		if (hierarchy['children']) {
			for (const subHierarchy of hierarchy['children']) {
				getVarsFromHierarchy(subHierarchy, addVars, removeVars, parentVars)	
			}
		}
	}	
}

function attachOptionsToSelectElem(selectId, options, wrapperColId=null) {

	$("#" + selectId).empty();
	for (const option of options) {
		$("#" + selectId).append('<option value="' + option + '">' + option + '</option>');	
	}
	$("#" + selectId).selectpicker("refresh");
	if (options.length > 0 && wrapperColId) {		
		makeElemVisible(wrapperColId);		
	}
	else if (options.length === 0 && wrapperColId) {
		makeElemInvisible(wrapperColId);
	}
}

function addOptionToSelectElem(selectId, option) {

	$("#" + selectId).append('<option value="' + option + '">' + option + '</option>');
	$("#" + selectId).selectpicker("refresh");
}

function removeSelectedOption(selectId) {

	$('#' + selectId + ' option:selected').remove();	
	$('#' + selectId).selectpicker('refresh');
}

function resetSelectPicker(selectId) {

	$("#" + selectId).val('default').selectpicker("refresh");
}

function makeElemVisible(domId) {

	$("#" + domId).removeClass('d-none').show();
}

function makeElemInvisible(domId) {

	$("#" + domId).addClass('d-none').show();	
}

function onchangeVariableLevelCB(elem) {

  console.log("place holder");
}

function onkeydownVariableLevel(even, elem) {

  if(event.keyCode == 13) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const value = $(elem).val();
    $("#variable-level-dropdown-menu form").prepend('<div class="form-check ml-4">' +
                                              '<input type="checkbox" class="form-check-input" id="' + value + '" checked onchange="onchangeFieldTypeCB(this, event)" value="' + value + '">' +
                                              '<label class="form-check-label" for="' + value + '">' +
                                              value + 
                                              '</label>' + 
                                              '</div>');    
    return false;
  }

}

function removeVariable() {

	const node = $("#remove-variable-select").val();
	removeNodeFromHierarchy(data, node, false);	
	clearSVG();	
	renderTreeLayout(data);
	renderPackedCircles(data);
	removeSelectedOption("remove-variable-select");
	addOptionToSelectElem("variables-select", node);
}

function addNode() { //we should ahve agolobal var vis =[{'data': null, 'svg': }], to track list of visulisation 

	const node = $("#variables-select").val();
	const parent = $("#variables-parent-select").val();	

	if(!node) {
		errorAlert("You must select a variable to add to hierarchy!");
		return;	
	}

	if (data && Object.keys(data).length !== 0 && !parent) {
		errorAlert("You must select a parent node for the variable you want to add to hierarchy!");
		return;
	}	

	if (!addNodeToHierarchy(data, parent, node)) {
		data = {
			"name": node,
			"value": 20, 
			"children": []			
		};	
	}	
	clearSVG();	
	renderTreeLayout(data);
	renderPackedCircles(data);	
	removeSelectedOption("variables-select");
	makeElemVisible("variables-parent-col-wrapper");
	makeElemVisible("remove-variable-col-wrapper");
	addOptionToSelectElem("remove-variable-select", node);
	addOptionToSelectElem("variables-parent-select", node);
	resetSelectPicker("variables-parent-select");
}

/*
* This recursive function returns true, if hierarchy object passed to it gets updated 
* meaning the parent element is found in hierarchy parameter 
* and child node is successfully added to the children list of parent node. 
* Otherwise if parent node is not found, function returns false and hierarchy object doesn't change.
*/
function addNodeToHierarchy(hierarchy, parent, node) {

	if (!hierarchy) {
		return false;
	}
	else if (hierarchy['name'] === parent) {
		hierarchy['children'].push({"name": node, 
							   "value": 20, 
							   "children": []
							});
		return true;		
	}
	else if (hierarchy['children']){
		for (const subHierarchy of hierarchy['children']) {			
			if (addNodeToHierarchy(subHierarchy, parent, node)) {
				return true;	
			}				
		}
		return false;
	}
}

/*
* This recursive function returns true, if hierarchy object passed to it gets updated 
* meaning the node parameter passed to object is found in hierarchy parameter.
* This function works in two modes:
* If strict mode is set to true, the node along with its sub-tree gets removed
* if strcit mode is set to false, the subtree belonging to node hets attached to parent element. 
*/
function removeNodeFromHierarchy(hierarchy, node, strictMode, parent=null) {

	if (!hierarchy) {
		return false;
	}
	if (!parent && hierarchy['name'] === node) {
		if (strictMode) {
			errorAlert("You can't remove the root node in strict mode!");
			return false;
		}

		const keys = Object.keys(hierarchy);
		for (const key of keys) {
			delete hierarchy[key]; 
		}		
		return true;
	}
	else if (parent && hierarchy['name'] === node) {
		if (strictMode) {
			parent['children'].push(...hierarchy['children']);
		}		
		parent['children'] = parent['children'].filter((elem, index) => {  			
  			return elem['name'] !== node;
		});					
		return true;		
	}
	else if (hierarchy['children']){
		for (const subHierarchy of hierarchy['children']) {			
			if (removeNodeFromHierarchy(subHierarchy, node, strictMode, hierarchy)) {
				return true;	
			}				
		}
		return false;
	}
}

function resetViz() {

	clearSVG();	
}

function clearSVG() {
	
	d3.select('#packed-circles g').
	selectAll("*").
	remove();

	d3.select('#tree-layout g .links').
	selectAll("*").
	remove();

	d3.select('#tree-layout g .nodes').
	selectAll("*").
	remove();
}

function renderTreeLayout(data) {

	if (!data) {
		clearSVG();
		return;
	}

	var treeLayout = d3.tree()
	.size([400, 200])

	var root = d3.hierarchy(data)

	treeLayout(root);

	// Nodes
	d3.select('#tree-layout g.nodes')
		.selectAll('circle.node')
		.data(root.descendants())
		.join('circle')
		.classed('node', true)
		.attr('cx', function(d) {return d.x;})
		.attr('cy', function(d) {return d.y;})
		.attr('r', 4);	

	// Links
	d3.select('#tree-layout g.links')
		.selectAll('line.link')
		.data(root.links())
		.join('line')
		.classed('link', true)
		.attr('x1', function(d) {return d.source.x;})
		.attr('y1', function(d) {return d.source.y;})
		.attr('x2', function(d) {return d.target.x;})
		.attr('y2', function(d) {return d.target.y;});

	// Labels
	d3.select('#tree-layout g.nodes')
	.selectAll('text.label')
	.data(root.descendants())
	.join('text')
	.classed('label', true)
	.attr('x', function(d) {return d.x;})
	.attr('y', function(d) {return d.y - 10;})
	.text(function(d) {
		return d.data.name;
	});
}

function renderPackedCircles(data) {

	if (!data) {
		clearSVG();
		return;
	}
	
	var packLayout = d3.pack().size([300, 300]).padding(10);

	var rootNode = d3.hierarchy(data)

	rootNode.sum(function(d) {
		return d.value;
	});

	packLayout(rootNode);

	var nodes = d3.select('#packed-circles g')
		.selectAll('g')
		.data(rootNode.descendants())
		.join('g')
		.attr('transform', function(d) {return 'translate(' + [d.x, d.y] + ')'})	

	nodes.append('circle')		
		.attr('r', function(d) { return d.r; });

	nodes
	.append('text')
	.attr('dy', 4)
	.text(function(d) {
		return d.children === undefined ? d.data.name : '';
	})	
}

function saveVariableHierarchy(fileId) {  
    
    $.ajax({      
      type: 'PUT',
      url: '/api/files/variables-hierarchy/' + fileId, 
      contentType: 'application/json',   
      data: JSON.stringify({variablesHierarchy: data}),                        
      success: function (result) {          
      	
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });  
}
