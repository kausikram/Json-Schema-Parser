describe("schemaParser", function() {
	describe("schemaParser init", function() {
		it("should instantiate an instance of schemaParser", function() {
			var schema_parser = new schemaParser({
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"type" : "string",
					}
				}
			});
			expect( schema_parser instanceof schemaParser).toBeTruthy();
		});
	});

	describe("schemaParser getFormType", function() {
		describe("should return schema specified types", function() {
			var json;
			var schema_parser;
			var forms_created;
			var form_order;
			var prop_path;
			beforeEach(function() {
				json = {
					"$schema" : "http://json-schema.org/draft-04/schema#",
					"title" : "FileSystem",
					"properties" : {
						"storage" : {
							"type" : "object",
							"properties" : {
								"type" : {
									"type" : "string"
								},
								"remotePath" : {
									"type" : "string"
								},
								"enumField" : {
									"enum" : ["1", "2", "3"]
								},
								"booleanField" : {
									"type" : "boolean",
									"enum" : ["1", "2", "3"]
								}
							}
						}
					}
				};
				schema_parser = new schemaParser(json);
				forms_created = {};
				form_order = [];
				prop_path = json["properties"]["storage"]["properties"];
			});
			it("should return the type if type is present", function() {
				var type = schema_parser.getFormType(prop_path["type"]);
				expect(type).toEqual("string");
			});
			it("should handle boolean and enum fields separately", function() {
				var type = schema_parser.getFormType(prop_path["enumField"]);
				expect(type).toEqual("select");
				type = schema_parser.getFormType(prop_path["booleanField"]);
				expect(type).toEqual("radio");
			});
		});
		it("should recognize an object type if the type is not explicitly provided", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"storage" : {
						"type" : "string",
					}
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			var type = schema_parser.getFormType(json);
			expect(type).toEqual("object");
		});

		it("should recognize an array type if the type is not explicitly provided", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"items" : {
					"properties" : {
						"type" : {
							"type" : "string"
						}
					}
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			var type = schema_parser.getFormType(json);
			expect(type).toEqual("array");
		});

		it("should recognize a type if a $ref exists", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"time" : {
						"$ref" : "#/definitions/time_object"
					}
				},
				"definitions" : {
					"time_object" : {
						"properties" : {
							"day" : {
								"type" : "string"
							}
						}
					}
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			var type = schema_parser.getFormType(json["properties"]["time"]);
			expect(type).toEqual("object");
		});

		it("should throw an error if the type cannot be determined", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"storage" : {
					}
				}
			};

			var schema_parser = new schemaParser(json);
			expect(function() {
				schema_parser.getFormType(json.properties.storage)
			}).toThrow(new Error("Cannot determine type of form"));
		});
	});

	describe("schemaParser getRefSchema", function() {
		it("should get the schema specified in $ref", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"type" : "object",
						"$ref" : "#/definitions/nfs"
					}
				},
				"definitions" : {
					"nfs" : {
						"properties" : {
							"type" : {
								"type" : "string"
							}
						}
					}
				}
			};
			var schema_parser = new schemaParser(json);
			var ref_path_parts = "#/definitions/nfs".split("/");
			var ref_schema = schema_parser.getRefSchema(ref_path_parts);

			var expected_ref_schema = {
				"properties" : {
					"type" : {
						"type" : "string"
					}
				}
			};

			expect(ref_schema).toEqual(expected_ref_schema);
		});
	});

	describe("schemaParser __initDynoform__", function() {
		it("should return an instance of dynoformStructure", function() {
			var _fragment = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"storage" : {
						"type" : "string"
					}
				}
			};
			var next_root;
			var forms_created = {};
			var form_order = [];
			path = "#";
			var schema_parser = new schemaParser(_fragment);
			var dynoform_structure = schema_parser.__initDynoform__(schema_parser.root, schema_parser.root);
			expect( dynoform_structure instanceof dynoformStructure).toBeTruthy();
		});
	});

	describe("schemaParser __detectHeadlessForm__", function() {
		it("should detect array types that do not have objects as items but a single field", function() {
			//this is to create dynoforms with no fieldset heading so that only the field is rendered
			//instead of along with a fieldset heading
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "array",
				"items" : {
					"type" : "string"
				}

			};
			var _is_headless_form = new schemaParser(json).__detectHeadlessForm__(json.items);
			expect(_is_headless_form).toBeTruthy();
		});
	});

	describe("schemaParser __arrayButtonHandler__", function() {
		it("should create the appropriate forms", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "array",
				"items" : {
					"type" : "string"
				}

			};
			var schema_parser = new schemaParser(json, "FileSystem");
			var forms_created = {};
			var form_order = [];

			var items = json.items;
			var next_root = "FileSystem";
			var root = next_root;
			var path = "#";
			var button_div = new Button(root).html;
			button = $(button_div).find("button");
			schema_parser.__arrayButtonHandler__(button, $.Event("click"), items, next_root, root, path);
			expect($(button_div).find("input").length).toEqual(1);
			expect(button.html()).toEqual("FileSystem");
		});
	});

	describe("schemaParser __createArrayButton__", function() {
		it("should create a button with the button text as json root title for a json schema of type array", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "array",
				"items" : {
					"title" : "FSItems",
					"properties" : {
						"storage" : {
							"type" : "string"
						}
					}
				}
			};
			var schema_parser = new schemaParser(json);
			var forms_created = {};
			var form_order = [];
			var root = "FileSystem";
			var path = "#";
			schema_parser.__createArrayButton__(json, json.items, root, forms_created, form_order, path);
			expect(forms_created["FileSystem"] instanceof Button).toBeTruthy();
			expect($(forms_created["FileSystem"].html).find("button").html()).toEqual("FSItems");
		});

		it("should not create a button with root as text for the array with self reference", function() {
			var json = {
				"items" : {
					"$ref" : "#"
				}
			};
			var schema_parser = new schemaParser(json, "Self");
			var forms_created = {};
			var form_order = [];
			var root = "Self";
			var path = "#";
			schema_parser.__createArrayButton__(json, json.items, root, forms_created, form_order, path);
			expect(forms_created["Self"]).toBeFalsy();
			expect(forms_created["Self_self_reference"]).toBeTruthy();
		});
	});

	describe("schemaParser __createDynoformStructure__", function() {
		var json;
		var schema_parser;
		var forms_created;
		var form_order;
		var root;
		var path;
		var dynoform_structure;
		beforeEach(function() {
			json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"type" : "object",
						"properties" : {
							"type" : {
								"type" : "string"
							},
							"remotePath" : {
								"type" : "string"
							},
							"enumField" : {
								"type" : "string",
								"enum" : ["1", "2", "3"]
							}
						}
					}
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			root = "FileSystem";
			path = "#";
			dynoform_structure = new schemaParser(json).__createDynoformStructure__(json, root, forms_created, form_order, path);
		});
		it("should create a dynoform structure with the form name as json root title for a json schema of type object", function() {
			expect( dynoform_structure instanceof dynoformStructure).toBeTruthy();
			expect(dynoform_structure.form.name).toEqual("FileSystem");
		});
		it("should create a dynoform structure for a property of type object", function() {
			expect(forms_created["storage"] instanceof dynoformStructure).toBeTruthy();
		});
		it("should create a dynoform structure with fields as the properties specified in the schema", function() {
			expect(forms_created["storage"].fields.length).toEqual(3);
			expect(forms_created["storage"].fields[0].type).toEqual("text");
			expect(forms_created["storage"].fields[2].type).toEqual("select");
		});
	});

	describe("schemaParser __handleObjectRef__", function() {
		it("should create a button and add a handler to it by calling __objectRefButtonHandler__", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"type" : "object",
						"$ref" : "#/definitions/nfs"
					}
				},
				"definitions" : {
					"nfs" : {
						"properties" : {
							"type" : {
								"type" : "string"
							}
						}
					}
				}
			};
			var schema_parser = new schemaParser(json, "FileSystem");
			var root = "storage";
			var path;
			spyOn(schema_parser, "__objectRefButtonHandler__");
			var button = schema_parser.__handleObjectRef__(json.properties.storage, root);
			expect( button instanceof Button).toBeTruthy();
			$(button.html).find("button").click();
			expect(schema_parser.__objectRefButtonHandler__).toHaveBeenCalled();
		});
	});

	describe("schemaParser __objectRefButtonHandler__", function() {
		it("should create the appropriate forms", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"type" : "object",
						"$ref" : "#/definitions/nfs"
					}
				},
				"definitions" : {
					"nfs" : {
						"properties" : {
							"type" : {
								"type" : "string"
							}
						}
					}
				}
			};
			var schema_parser = new schemaParser(json, "FileSystem");
			var forms_created = {};
			var form_order = [];
			var root = "storage";
			var ref_path_parts = json["properties"]["storage"].$ref.split("/");
			var next_root = ref_path_parts[ref_path_parts.length - 1];
			var path = ref_path_parts.slice(ref_path_parts.length - 2, 1);
			path = path.join("/");
			var button_div = new Button(root).html;
			button = $(button_div).find("button");
			schema_parser.__objectRefButtonHandler__(button, $.Event("click"), ref_path_parts, next_root, path);
			expect($(button_div).find("input").length).toEqual(1);
			expect($(button_div).find("button").length).toEqual(0);
		});
	});

	describe("schemaParser __processRootName__", function() {
		var json = {
			"$schema" : "http://json-schema.org/draft-04/schema#",
			"title" : "Project|Service",
			"properties" : {
				"type" : {
					"type" : "string"
				}
			}
		};
		var schema_parser = new schemaParser(json);
		expect(schema_parser.__processRootName__(schema_parser.root)).toEqual("Project");
		expect(schema_parser.__processRootName__("Project")).toEqual("Project");
		expect(schema_parser.__processRootName__("")).toEqual("");
		expect(function() {
			schema_parser.__processRootName__(null)
		}).toThrow(new Error("Field name : null"))
	});

	describe("schemaParser createForms", function() {

		it("should throw an error if the type is not specified and neither is items or properties defined", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"definitions" : {
					"nfs" : {
						"properties" : {
							"type" : {
								"type" : "string"
							}
						}
					}
				}
			};
			expect(function() {
				new schemaParser(json)
			}).toThrow(new Error("Cannot determine type of form"));
		});

		it("should call __createDynoformStructure__ for object types without $ref", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"properties" : {
							"type" : {
								"type" : "string"
							}
						}
					}
				}
			};
			var schema_parser = new schemaParser(json);
			var forms_created = {};
			var form_order = [];
			spyOn(schema_parser, "__createDynoformStructure__");
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(schema_parser.__createDynoformStructure__).toHaveBeenCalled();
		});

		it("should call __handleObjectRef__ for object types with $ref", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"properties" : {
							"type" : {
								"type" : "string"
							}
						}
					},
					"self" : {
						"$ref" : "#"
					}
				}
			};
			var schema_parser = new schemaParser(json);
			var forms_created = {};
			var form_order = [];
			spyOn(schema_parser, "__handleObjectRef__");
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(schema_parser.__handleObjectRef__).toHaveBeenCalled();
			//expect(forms_created["self"]).toBeTruthy();
			//expect(forms_created["self"] instanceof Button).toBeTruthy();
			//expect($(forms_created["self"].html).find("button")).toBeTruthy();
			//expect($(forms_created["self"].html).find("button").html()).toEqual("self");
		});

		it("should call __createArrayButton__", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "array",
				"items" : {
					"title" : "FSItems",
					"properties" : {
						"storage" : {
							"remotePath" : {
								"type" : "string"
							}
						}
					}
				}
			};
			var schema_parser = new schemaParser(json);
			var forms_created = {};
			var form_order = [];
			spyOn(schema_parser, "__createArrayButton__");
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(schema_parser.__createArrayButton__).toHaveBeenCalled();
		});
	});
});
