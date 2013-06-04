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

	describe("schemaParser create dynoform structure for type object without $ref", function() {
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
		it("should recognize an object type even if the type is not explicitly provided", function() {
			var json = {
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
							}
						}
					}
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			var type = schema_parser.getFormType(json);
			expect(type).toEqual("object");
		});
		var json;
		var schema_parser;
		var forms_created;
		var form_order;
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
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
		});
		it("should create a dynoform structure with the form name as json root title for a json schema of type object", function() {
			expect(forms_created["FileSystem"] instanceof dynoformStructure).toBeTruthy();
			expect(forms_created["FileSystem"].form.name).toEqual("FileSystem");
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
	describe("schemaParser create button for type object with $ref", function() {
		it("should create a button for the object referenced by $ref without self reference", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
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
			var forms_created = {};
			var form_order = [];
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(forms_created["storage"]).toBeTruthy();
			expect(forms_created["storage"] instanceof Button).toBeTruthy();
			expect($(forms_created["storage"].html).find("button").html()).toEqual("storage");
		});
		it("should create a button for the object referenced by $ref with self reference", function() {
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
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(forms_created["self"]).toBeTruthy();
			expect(forms_created["self"] instanceof Button).toBeTruthy();
			expect($(forms_created["self"].html).find("button")).toBeTruthy();
			expect($(forms_created["self"].html).find("button").html()).toEqual("self");
		});
	});
	describe("schemaParser create dynoform structure for type array without $ref", function() {
		it("should recognize an array type even if the type is not explicitly provided", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"storage" : {
						"items" : {
							"properties" : {
								"type" : {
									"type" : "string"
								},
								"remotePath" : {
									"type" : "string"
								}
							}
						}
					}
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			var type = schema_parser.getFormType(json["properties"]["storage"]);
			expect(type).toEqual("array");
		});
		var json;
		var schema_parser;
		var forms_created;
		var form_order;
		beforeEach(function() {
			json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "array",
				"items" : {
					"title" : "FSItems",
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
				}
			};
			schema_parser = new schemaParser(json);
			forms_created = {};
			form_order = [];
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
		});
		it("should create a button with the button text as json root title for a json schema of type array", function() {
			expect(forms_created["FileSystem"] instanceof Button).toBeTruthy();
		});
	});
	describe("schemaParser create button for type object with $ref", function() {
		it("should create a button for the object referenced by $ref without self reference", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"type" : "object",
				"properties" : {
					"storage" : {
						"items" : {
							"$ref" : "#/definitions/nfs"
						}
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
			var forms_created = {};
			var form_order = [];
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(forms_created["storage"]).toBeTruthy();
			expect(forms_created["storage"] instanceof Button).toBeTruthy();
			expect($(forms_created["storage"].html).find("button").html()).toEqual("storage");
		});
		it("should not create a button for the object referenced by $ref with self reference", function() {
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
						"items" : {
							"$ref" : "#"
						}
					}
				}
			};
			var schema_parser = new schemaParser(json);
			var forms_created = {};
			var form_order = [];
			schema_parser.createForm(schema_parser.root, json, null, forms_created, form_order, "#");
			expect(forms_created["self"]).toBeFalsy();
		});
	});
});