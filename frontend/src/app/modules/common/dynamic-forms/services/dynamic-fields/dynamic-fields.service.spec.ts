import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { HttpClient } from "@angular/common/http";
import { IOPFieldModel } from "core-app/modules/common/dynamic-forms/typings";
import { DynamicFieldsService } from "core-app/modules/common/dynamic-forms/services/dynamic-fields/dynamic-fields.service";
import { isObservable } from "rxjs";

fdescribe('DynamicFieldsService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service:DynamicFieldsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        DynamicFieldsService,
      ]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DynamicFieldsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a proper dynamic form schema', () => {
    const formPayload = {
      "name": "Project 1",
      "_links": {
        "parent": {
          "href": "/api/v3/projects/26",
          "title": "Parent project"
        }
      }
    };
    const formSchema = {
      "name": {
        "type": "String",
        "name": "Name",
        "required": true,
        "hasDefault": false,
        "writable": true,
        "minLength": 1,
        "maxLength": 255,
        "options": {}
      },
      "parent": {
        "type": "Project",
        "name": "Subproject of",
        "required": false,
        "hasDefault": false,
        "writable": true,
        "_links": {
          "allowedValues": {
            "href": "/api/v3/projects/available_parent_projects?of=25"
          }
        }
      },
      "id": {
        "type": "Integer",
        "name": "ID",
        "required": true,
        "hasDefault": false,
        "writable": false,
        "options": {}
      },
      _dependencies: [],
    };

    // @ts-ignore
    const fieldsSchemas = service._getFieldsSchemasWithKey(formSchema, formPayload);

    expect(fieldsSchemas.length).toBe(2, 'should return only writable field schemas');
    expect(fieldsSchemas[0].key).toBe('name', 'should place the correct key on primitives');
    expect(fieldsSchemas[1].key).toBe('_links.parent', 'should place the correct key on resources');
  });

  it('should format the form model (add the name property to resources (_links: single and multiple))', () => {
    const formPayload = {
      "title": "Project 1",
      "_links": {
        "parent": {
          "href": "/api/v3/projects/26",
          "title": "Parent project"
        },
        "children": [
          {
            "href": "/api/v3/projects/27",
            "title": "Child project 1"
          },
          {
            "href": "/api/v3/projects/28",
            "title": "Child project 2"
          }
        ]
      },
    };
    const formSchema = {
      "title": {
        "type": "String",
        "name": "Name",
        "required": true,
        "hasDefault": false,
        "writable": true,
        "minLength": 1,
        "maxLength": 255,
        "options": {}
      },
      "parent": {
        "type": "Project",
        "name": "Subproject of",
        "required": false,
        "hasDefault": false,
        "writable": true,
        "_links": {
          "allowedValues": {
            "href": "/api/v3/projects/available_parent_projects?of=25"
          }
        }
      },
      "children": {
        "type": "Project",
        "name": "Project's children",
        "required": false,
        "hasDefault": false,
        "writable": true,
        "_links": {
          "allowedValues": {
            "href": "/api/v3/projects/available_parent_projects?of=25"
          }
        }
      },
      _dependencies: [],
    };

    // @ts-ignore
    const formModel = service.getModel(formSchema, formPayload);
    const titleName = formModel.title;
    const parentProjectName = !Array.isArray(formModel._links!.parent) && formModel._links!.parent!.name;
    const childrenProjectsNames = Array.isArray(formModel._links!.children) && formModel._links!.children!.map((childProject: IOPFieldModel) => childProject.name);

    expect(titleName).toBe('Project 1', 'should add the payload value on primitives');
    expect(parentProjectName).toEqual('Parent project', 'should add a name property on resources');
    expect(childrenProjectsNames).toEqual(['Child project 1', 'Child project 2'], 'should add a name property on resources with multiple values');
  });

  it('should generate a proper dynamic form config', () => {
    const formPayload = {
      "name": "Project 1",
      "_links": {
        "parent": {
          "href": "/api/v3/projects/26",
          "title": "Parent project"
        },
      }
    };
    const formSchema = {
      "parent": {
        "type": "Project",
        "name": "Subproject of",
        "required": false,
        "hasDefault": false,
        "writable": true,
        "_links": {
          "allowedValues": {
            "href": "/api/v3/projects/available_parent_projects?of=25"
          }
        }
      },
      "name": {
        "type": "String",
        "name": "Name",
        "required": true,
        "hasDefault": false,
        "writable": true,
        "minLength": 1,
        "maxLength": 255,
        "options": {},
        "attributeGroup": "People"
      },
      _attributeGroups: [
        {
          "_type": "WorkPackageFormAttributeGroup",
          "name": "People",
          "attributes": [
            "name",
          ]
        },
      ]
    };
    // @ts-ignore
    const formlyConfig = service.getConfig(formSchema, formPayload);
    const formlyFields = formlyConfig.reduce((result, formlyField) => {
      return formlyField.fieldGroup ? [...result, ...formlyField.fieldGroup] : [...result, formlyField];
    }, []);
    const formGroup = formlyConfig[1];
    const everyFieldHasCSSClass = formlyFields.every(formlyField =>  formlyField.className!.startsWith('op-form--field'));

    expect(everyFieldHasCSSClass).toBeTruthy('should place the op-form--field class on every field');
    expect(formlyFields[1].templateOptions!.required).toBe(true, 'should set the required attribute');
    expect(formlyFields[1].templateOptions!.label).toBe('Name', 'should set the correct label');
    expect(isObservable(formlyFields[0].templateOptions!.options)).toBeTruthy('should add options as observables');
    expect(formlyFields[0].className).toContain('Subproject of', 'should add the specific input type properties');
    expect(formlyFields[0].templateOptions!.locale).toBeTruthy('should add the specific input templateOptions');

    expect(formGroup).toBeTruthy();
    expect(formGroup.wrappers![0]).toEqual('op-dynamic-field-group-wrapper', 'should add the form field group wrapper');
    expect(formGroup.fieldGroupClassName).toEqual('op-form--field-group', 'should add the CSS class to the field group wrapper');
    expect(formGroup.templateOptions!.label).toEqual('People', 'should add the correct label to the field group wrapper');
    expect(formGroup.fieldGroup![0].key).toEqual('name', 'should add the correct key to the field group wrapper');
  });
});
