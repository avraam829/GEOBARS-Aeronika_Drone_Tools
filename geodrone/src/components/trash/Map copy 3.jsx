window.tb = new Threebox(
	map,
	map.getCanvas().getContext('webgl'), //get the context from the map canvas
	{ defaultLights: true }
);
map.addLayer({
	id: 'custom_layer',
	type: 'custom',
	renderingMode: '3d',
	onAdd: function (map, gl) {
		var geometry = new THREE.BoxGeometry(30, 60, 120);
		let cube = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x660000 }));
		cube = tb.Object3D({ obj: cube, units: 'meters' });
		cube.setCoords([-3.460539968876, 40.4849214450]);
		tb.add(cube);
	},
	render: function (gl, matrix) {
		tb.update(); //update Threebox scene
	}
}