var Button = function(button_text) {
	var div = jQuery("<div>");
	var button = jQuery("<button>").html(button_text);
	div.append(button);
	this.html = div;
};

var Form = function(name, id) {
	this.name = name;
	this.id = id || name;
	this.method = "";
	this.action = "";
};

var Field = function(name, type, fieldset) {
	this.name = name;
	this.label = name;
	this.type = "text";
	this.fieldset = fieldset || schemaParser.FIELDSET;
};

var dynoformStructure = function() {
	this.form = {};
	this.fields = [];
	this.buttons = [];
	this.fieldsets = [["My Form", schemaParser.FIELDSET, {}]];
}
var schemaParser = function(json, form_name) {
	this.init(json, form_name);
};

schemaParser.ARRAY = "array";
schemaParser.OBJECT = "object";
schemaParser.INPUT = "input";
schemaParser.FIELDSET = "myform";

schemaParser.prototype = {
	init : function(json, form_name) {

		if ( typeof (json) === "undefined")
			json = {};

		this.schema = json;
		this.root_type = json.type || this.getFormType(json);
		this.root = form_name || json.title;
		var forms_created = {};
		this.createForm(this.root, json, null, forms_created);
		this.display("#hello_div" , forms_created, false);
	},

	getRefSchema : function(ref_path_parts) {
		var ref_schema = null;

		//assuming that index 0 is going to be # everytime
		ref_schema = this.schema;
		for (var i = 1; i < ref_path_parts.length; i++) {
			ref_schema = ref_schema[ref_path_parts[i]];
		}
		return ref_schema;
	},

	getFormType : function(_fragment) {
		var type;
		if (_fragment.items) {
			type = schemaParser.ARRAY;
		} else if (_fragment.properties) {
			type = schemaParser.OBJECT;
		} else if (_fragment.$ref) {
			var ref_path_parts = _fragment.$ref.split("/");
			_fragment = this.getRefSchema(ref_path_parts);
			type = this.getFormType(_fragment);
		}

		if (!type || (type).trim() == "") {
			throw new Error("Cannot determine type of form");
		}

		return type;
	},

	createForm : function(root, _fragment, parent_dynoform, forms_created) {
		var next_root;
		var me = this;
		var recognized_type;
		
		//OrangeScape specific
		root = root.split("|")[0];

		if (!_fragment.type) {
			recognized_type = this.getFormType(_fragment);
		} else {
			recognized_type = _fragment.type;
		}

		if (recognized_type == schemaParser.ARRAY) {
			var items;
			if (!_fragment.items) {
				throw new Error("Please check your Schema");
			}
			if (_fragment.items.$ref) {
				var ref_path_parts = _fragment.items.$ref.split("/");
				items = me.getRefSchema(ref_path_parts);
				next_root = ref_path_parts[ref_path_parts.length - 1];
				button = new Button(root);
			} else {
				items = _fragment.items;
				next_root = items.title || root || "Items";
				button = new Button(next_root);
			}
			$(button.html.find("button")).on("click", function(e) {
				e.preventDefault();
				var _tiny_fragment = items;
				var forms_created = {}
				var dynoform_structure = new dynoformStructure();
				dynoform_structure.form = new Form(root);
				me.createForm(next_root, _tiny_fragment, dynoform_structure, forms_created);
				if (!forms_created[next_root])
					forms_created[next_root] = dynoform_structure;
				me.display(this.parentNode, forms_created, true);
			});
			forms_created[root] = button;
		} else if (recognized_type == schemaParser.OBJECT) {
			if (_fragment.$ref) {
				var ref_path_parts = _fragment.$ref.split("/");
				next_root = ref_path_parts[ref_path_parts.length - 1];
				var button = new Button(root);
				$(button.html.find("button")).on("click", function(e) {
					e.preventDefault();
					var _tiny_fragment = me.getRefSchema(ref_path_parts);
					var forms_created = {}
					me.createForm(next_root, _tiny_fragment, null, forms_created);
					me.display(this.parentNode, forms_created, false);
					this.parentNode.children[0].remove();
				});
				forms_created[root] = button;
			} else {
				var dynoform_structure = new dynoformStructure();
				dynoform_structure.form = new Form(root);
				var new_field_set = [[root, root, {}]];
				dynoform_structure.fieldsets = new_field_set;
				var properties = _fragment.properties;
				for (var prop in properties) {
					next_root = prop;
					this.createForm(next_root, properties[prop], dynoform_structure, forms_created);
				}
				forms_created[root] = dynoform_structure;
			}

		} else {
			var field = new Field(root, _fragment.type, parent_dynoform.form.name);
			parent_dynoform.fields.push(field);
		}
	},
	display : function(hook, forms_created, indent){
		for (var form_name in forms_created){
			var new_form;
			if (forms_created[form_name] instanceof dynoformStructure){
				new_form = $("<div>").dynoForm(forms_created[form_name]).clone(true);
			}
			else {
				new_form = forms_created[form_name].html.clone(true);
			}
			if (indent)
				new_form.addClass("indent");
			
			$(hook).append(new_form);
		}
	}
}

