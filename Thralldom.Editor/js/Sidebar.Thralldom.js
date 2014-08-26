/// <reference path="Editor.js" />
/// <reference path="libs/signals.min.js" />
/// <reference path="libs/ui.three.js" />
/// <reference path="libs/ui.js" />
Sidebar.Thralldom = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.CollapsiblePanel();
	container.setDisplay( 'none' );

	container.add( new UI.Text().setValue( 'THRALLDOM' ) );
	container.add( new UI.Break(), new UI.Break() );


	// name

	var thralldomIdRow = new UI.Panel();
	var thralldomId = new UI.Input().setWidth( '150px' ).setColor( '#444' ).setFontSize( '12px' ).onChange(update);

	thralldomIdRow.add( new UI.Text( 'Id' ).setWidth( '90px' ) );
	thralldomIdRow.add( thralldomId );

	// tags

	var thralldomTagsRow = new UI.Panel();
	var thralldomTags = new UI.Input().setWidth('150px').setColor('#444').setFontSize('12px').onChange(update);

	thralldomTagsRow.add(new UI.Text('Tags').setWidth('90px'));
	thralldomTagsRow.add(thralldomTags);


	// export type

	var thralldomExportRow = new UI.Panel();
	var exportOptions = new UI.Select().setOptions({

	    'None': 'None',
	    'Environment': 'Environment',
	    'Terrain': 'Terrain',
	    'Character': 'Character',
	}).setWidth('150px').setColor('#444').setFontSize('12px').onChange(update);



	thralldomExportRow.add(new UI.Text('Export As').setWidth('90px'));
	thralldomExportRow.add(exportOptions);

	var thralldomInteractionRow = new UI.Panel();
	var interactionObject = new UI.Input().setWidth('150px').setColor('#444').setFontSize('12px').onChange(update);

	thralldomInteractionRow.add(new UI.Text('Interaction').setWidth('90px'));
	thralldomInteractionRow.add(interactionObject);


	function update() {
	    if (!editor.selected) {
	        console.warn("Possible loss of data, check Thralldom data on the previously selected object");
	        return;
	    }

		object = editor.selected;
		var type = exportOptions.getValue();
		var tags = thralldomTags.getValue();
	    // Get all tags, remove the commas 
		var extractedTags = tags.match(/\S*[^,\s]/g);
		var id = thralldomId.getValue();
		var interactionText = interactionObject.getValue();

		object.userData.exportAs = type;
		object.userData.tags = extractedTags || [];
		object.userData.id = id || "";
		object.userData.interaction = interactionText || "";

		editor.signals.objectChanged.dispatch(object);
	};


	function updateUI() {

	    object = editor.selected;
	    exportOptions.setValue(object.userData.exportAs);
	    thralldomId.setValue(object.userData.id);
	    thralldomTags.setValue(object.userData.tags.join(", "));
	};

	editor.signals.objectSelected.add(function () {
	    if (editor.selected && Object.keys(editor.selected.userData).length == 0) {
	        update();
	    }

	    if (editor.selected) {
	        container.setDisplay("block");
	        updateUI();
	    }
	    else {
	        container.setDisplay("none");
	    }
	});

	container.add(thralldomIdRow);
	container.add(thralldomTagsRow);
	container.add(thralldomExportRow);
	container.add(thralldomInteractionRow);


	return container;

}
