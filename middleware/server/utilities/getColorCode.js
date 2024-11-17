const fetchFromColorMap = (index) => {
	const colors = [
		"#cd6155",
		"#268bd2",
		"#859900",
		"#b567ae",
		"#81b29a",
		"#e0af68",
		"#af7ac5",
		"#3465a4",
		"#7887ab",
		"#c3899b",
		"#90b1dc",
		"#c2b280",
		"#848482",
		"#d69d85",
		"#92949c",
		"#ee9b00",
		"#9f79ee",
		"#543435",
		"#009473",
		"#795548",
	];
	return colors[index % colors.length];
};

module.exports = { fetchFromColorMap };
