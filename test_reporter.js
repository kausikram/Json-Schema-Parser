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

		it("should recognize an array type if the type is not explicitly provided", function() {
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

		it("should recognize a type if a $ref exists", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"storage" : {
						"items" : {
							"$ref" : "#/definitions/storage_array"
						}
					},
					"time" : {
						"$ref" : "#/definitions/time_object"
					}
				},
				"definitions" : {
					"storage_array" : {
						"properties" : {
							"type" : {
								"type" : "string"
							},
							"remotePath" : {
								"type" : "string"
							}
						}
					},
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
			var type = schema_parser.getFormType(json["properties"]["storage"]);
			expect(type).toEqual("array");
			type = schema_parser.getFormType(json["properties"]["time"]);
			expect(type).toEqual("object");
		});

		it("should throw an error if the type cannot be determined", function() {
			var json = {
				"$schema" : "http://json-schema.org/draft-04/schema#",
				"title" : "FileSystem",
				"properties" : {
					"storage" : {
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

			var schema_parser = new schemaParser(json)
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

	describe("schemaParser createForms", function() {

		describe("__initDynoform__", function() {
			it("should return an instance of dynoformStructure", function() {
				var _fragment = {
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
				var next_root;
				var forms_created = {};
				var form_order = [];
				path = "#";
				var schema_parser = new schemaParser(_fragment);
				var dynoform_structure = schema_parser.__initDynoform__(schema_parser.root, schema_parser.root);
				expect( dynoform_structure instanceof dynoformStructure).toBeTruthy();
			});
		});
		
		describe("__detectHeadlessForm__", function(){
			it("should detect array types that do not have objects as items", function(){
				
			});
		});
		
		describe("__arrayButtonHandler__", function(){
			//function(button_this, e, button, items, next_root, root, path)
			
		});

		describe("__createDynoformStructure__", function() {
			it("should create a dynoformStructure instance with a form and fields specified in the schema", function() {
				var _fragment = {
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
				root = "FileSystem";
				var next_root;
				var forms_created = {};
				var form_order = [];
				path = "#";
				var dynoform_structure = new schemaParser(_fragment).__createDynoformStructure__(_fragment, root, next_root, forms_created, form_order, path);
				expect( dynoform_structure instanceof dynoformStructure).toBeTruthy();
				expect(dynoform_structure.form.name).toEqual("FileSystem");
				expect(forms_created["storage"] instanceof dynoformStructure).toBeTruthy();
				expect(forms_created["storage"].fields.length).toEqual(2);
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
});
