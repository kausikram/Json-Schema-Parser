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

var Field = function(name, type, fieldset, options) {
	this.name = name;
	this.label = name;
	if ( typeof (type) === "undefined")
		throw new Error("Cannot detect type of the field");
	if (type == "string" || type == "number")
		type = "text";
	this.type = type;
	if ( typeof (options) !== "undefined") {
		this.options = [];
		for (var i = 0; i < options.length; i++) {
			var option_structure = [options[i], i];
			this.options.push(option_structure);
		}
	}
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
		if (_fragment.type == "boolean")
			return "radio";
		if (_fragment.enum)
			return "select";
		if (_fragment.type)
			return _fragment.type;
		
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

	__arrayButtonHandler__ : function(button_this, e, items, next_root, root, path) {
		var me = this;
		e.preventDefault();
		var _tiny_fragment = items;
		var forms_created = {};
		var form_order = [];
		var parent_dynoform = null;
		var _is_headless_form = me.__detectHeadlessForm__(_tiny_fragment);
		if (_is_headless_form) {
			parent_dynoform = me.__initDynoform__(root, "");
		}
		me.createForm(next_root, _tiny_fragment, parent_dynoform, forms_created, form_order, path);
		if (!forms_created[next_root]) {
			form_order.push(next_root);
			forms_created[next_root] = parent_dynoform;
		}
		me.display($(button_this).parent()[0], forms_created, form_order, true);
	},
	
	__detectHeadlessForm__ : function(_fragment) {
		var type = _fragment.type || this.getFormType(_fragment);
		if (type != "array" && type != "object") {
			return true;
		}
		return false;
	},

	__createArrayButton__ : function(_fragment, items, root, forms_created, form_order, path) {
		var button;
		var me = this;
		var next_root;
		var _is_self_reference = false;
		if (_fragment.items.$ref) {
			if (path.indexOf(_fragment.items.$ref) != -1)
				_is_self_reference = true;
			var ref_path_parts = _fragment.items.$ref.split("/");
			items = this.getRefSchema(ref_path_parts);
			next_root = ref_path_parts[ref_path_parts.length - 1];
			path = ref_path_parts.slice(ref_path_parts.length - 2, 1);
			path = path.join("/");
			button = new Button(root);
		} else {
			items = _fragment.items;
			next_root = items.title || root || "Items";
			button = new Button(next_root);
		}
		$(button.html.find("button")).on("click", function(e) {
			me.__arrayButtonHandler__(this, e, items, next_root, root, path);
		});
		if (_is_self_reference) {
			form_order.push(root + "_self_reference");
			forms_created[root + "_self_reference"] = button;
		} else {
			form_order.push(root);
			forms_created[root] = button;
		}
	},

	__handleObjectRef__ : function(_fragment, root) {
		var me = this;
		var ref_path_parts = _fragment.$ref.split("/");
		var next_root = ref_path_parts[ref_path_parts.length - 1];
		var path = ref_path_parts.slice(ref_path_parts.length - 2, 1);
		path = path.join("/");
		var button = new Button(root);
		$(button.html.find("button")).on("click", function(e) {
			me.__objectRefButtonHandler__(this, e, ref_path_parts, next_root, path);
		});
		return button;
	},
	
	__objectRefButtonHandler__ : function(button_this, e, ref_path_parts, next_root, path){
		var me = this;
		e.preventDefault();
		var _tiny_fragment = me.getRefSchema(ref_path_parts);
		var forms_created = {};
		var form_order = [];
		me.createForm(next_root, _tiny_fragment, null, forms_created, form_order, path);
		me.display($(button_this).parent()[0], forms_created, form_order, false);
		$(button_this).parent()[0].children[0].remove();
	},

	__initDynoform__ : function(root, fieldset_title) {
		var dynoform_structure = new dynoformStructure();
		dynoform_structure.form = new Form(root);
		var new_field_set = [[( typeof (fieldset_title) !== "undefined") ? fieldset_title : root, root, {}]];
		dynoform_structure.fieldsets = new_field_set;
		return dynoform_structure;
	},

	__createDynoformStructure__ : function(_fragment, root, forms_created, form_order, path) {
		var next_root;
		var dynoform_structure = this.__initDynoform__(root, root);
		var properties = _fragment.properties;
		for (var prop in properties) {
			next_root = prop;
			this.createForm(next_root, properties[prop], dynoform_structure, forms_created, form_order, path);
		}
		return dynoform_structure;
	},

	//if the field names need any pre processing before being rendered
	//override this function.
	//as of now, OS spec sends in fields in a <child> | <parent> format
	//this function process to extract just the child's name
	__processRootName__ : function(root) {
		if (root == null){
			throw new Error("Field name : null");
		}
		var root = root.split("|")[0];
		return root;
	},

	createForm : function(root, _fragment, parent_dynoform, forms_created, form_order, path) {
		var next_root;
		var me = this;
		var recognized_type;

		if ( typeof (path) === "undefined" || path.trim() == "") {
			path = "#";
		}

		if (path != "") {
			path += "/";

		}

		root = this.__processRootName__(root);

		if (path != "#")
			path += root;

		recognized_type = this.getFormType(_fragment);

		if (recognized_type == schemaParser.ARRAY) {
			var items;
			if (!_fragment.items) {
				throw new Error("Please check your Schema");
			}
			this.__createArrayButton__(_fragment, items, root, forms_created, form_order, path);
		} else if (recognized_type == schemaParser.OBJECT) {
			if (_fragment.$ref) {
				form_order.push(root);
				forms_created[root] = this.__handleObjectRef__(_fragment, root);
			} else {
				form_order.push(root);
				forms_created[root] = this.__createDynoformStructure__(_fragment, root, forms_created, form_order, path);
			}
		} else {
			var type = recognized_type;
			var options;
			if (_fragment.type == "boolean") {
				options = ["true", "false"];
			}
			if (_fragment.enum) {
				options = _fragment.enum;
			}
			var field = new Field(root, type, parent_dynoform.form.name, options);
			parent_dynoform.fields.push(field);
		}
	},

	display : function(hook, forms_created, form_order, indent) {
		for (var i = 0; i < form_order.length; i++) {
			var new_form;
			var form_name = form_order[i];
			if (forms_created[form_name] instanceof dynoformStructure) {
				new_form = $("<div>").dynoForm(forms_created[form_name]).clone(true);
			} else {
				new_form = forms_created[form_name].html.clone(true);
			}
			if (indent) {
				new_form.addClass("indent");
			}
			$(hook).append(new_form);
		}
	}
}

