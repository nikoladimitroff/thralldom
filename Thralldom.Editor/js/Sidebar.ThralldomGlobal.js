/// <reference path="Editor.js" />
/// <reference path="libs/signals.min.js" />
/// <reference path="libs/ui.three.js" />
/// <reference path="libs/ui.js" />
Sidebar.ThralldomGlobal = function (editor) {

	var signals = editor.signals;

	var container = new UI.CollapsiblePanel();

	container.add(new UI.Text().setValue('THRALLDOM GLOBAL'));
	container.add(new UI.Break(), new UI.Break());

	// Navmesh
	var navmesh = new UI.CollapsiblePanel();
	navmesh.setDisplay('none');
	navmesh.add(new UI.Text().setValue('Navmesh'));
	navmesh.add(new UI.Break(), new UI.Break());


	// raycasting height

	var thralldomHeightRow = new UI.Panel();
	var thralldomHeight = new UI.Number(200).setWidth('150px').setFontSize('12px').onChange(saveOptions);

	thralldomHeightRow.add(new UI.Text('Raycast height').setWidth('90px'));
	thralldomHeightRow.add(thralldomHeight);

	// dimensions
	var thralldomCellDimensionsRow = new UI.Panel();
	var thralldomCellSize = new UI.Number(25).setWidth('50px').onChange(saveOptions);

	thralldomCellDimensionsRow.add(new UI.Text('Cell Size').setWidth('90px'));
	thralldomCellDimensionsRow.add(thralldomCellSize);

	// slope
	var thralldomSlopeFactorRow = new UI.Panel();
	var thralldomMaxSlope = new UI.Number(Math.PI / 12).setWidth('50px').onChange(saveOptions);
	var thralldomFactor = new UI.Number(1.2).setWidth('50px').onChange(saveOptions);

    thralldomSlopeFactorRow.add(new UI.Text('Max Slope').setWidth('60px'));
    thralldomSlopeFactorRow.add(thralldomMaxSlope);
    thralldomSlopeFactorRow.add(new UI.Text('Factor').setWidth('60px'));
    thralldomSlopeFactorRow.add(thralldomFactor);

	// generation
	var thralldomGenerateMeshRow = new UI.Panel();
	var thralldomVisualizeMesh = new UI.Checkbox().setWidth('50px').setColor('#444').setFontSize('12px').onChange(saveOptions);


	var thralldomGenerateMesh = new UI.Button("Generate").setWidth("90px").onClick(generateMesh);

	thralldomGenerateMeshRow.add(new UI.Text('Visualize Mesh').setWidth('90px'));
	thralldomGenerateMeshRow.add(thralldomVisualizeMesh, thralldomGenerateMesh);

    // inspection

	var thralldomInspectMeshRow = new UI.Panel();

	var thralldomInspectButton = new UI.Button("Inspect Mesh")
                                .setWidth("90px")
                                .onClick(editor.thralldom.exporter.inspectMesh);

	thralldomInspectMeshRow.add(thralldomInspectButton);

	var pairs = [
		[thralldomHeight, "thralldom_height"], 
		[thralldomCellSize, "thralldom_cell_size"],
		[thralldomMaxSlope, "thralldom_max_slope"],
		[thralldomVisualizeMesh, "thralldom_visualize_mesh"]
	]
	function loadOptions() {
		pairs.forEach(function (pair) {
			if (editor.config.getKey(pair[1]) !== undefined)
				pair[0].setValue(editor.config.getKey(pair[1]));
		})
	}
	function saveOptions() {
		pairs.forEach(function (pair) {
			editor.config.setKey(pair[1], pair[0].getValue());
		})
	}


	function generateMesh() {
	    var height = thralldomHeight.getValue(),
			size = thralldomCellSize.getValue();

		var slope = thralldomMaxSlope.getValue();
		var factor = thralldomFactor.getValue();

		var shouldVisualize = thralldomVisualizeMesh.getValue();

		editor.thralldom.exporter.exportNavmesh(height, size, slope, factor, shouldVisualize);
	};

	container.add(thralldomHeightRow);
	container.add(thralldomCellDimensionsRow);
	container.add(thralldomSlopeFactorRow);
	container.add(thralldomGenerateMeshRow);
	container.add(thralldomInspectMeshRow);
	loadOptions();

	return container;

}
