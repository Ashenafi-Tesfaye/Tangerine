exports.doc = {
    "_id": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
    "collection": "TangyFormResponse",
    "form": {
        "fullscreen": false,
        "title": "Mother Case",
        "complete": false,
        "linearMode": true,
        "hideClosedItems": true,
        "hideCompleteFab": false,
        "tabIndex": 0,
        "showResponse": false,
        "showSummary": false,
        "hasSummary": false,
        "fullScreenGranted": false,
        "exitClicks": 0,
        "id": "mother-infant-cohort-manifest-3a453b",
        "tagName": "TANGY-FORM"
    },
    "location": {"Region": "R1", "District": "D1", "Aire": "A1", "Village": "V1"},
    "items": [{
        "id": "item1",
        "title": "Item 1",
        "summary": false,
        "fullscreen": false,
        "fullscreenEnabled": false,
        "hideButtons": true,
        "hideBackButton": true,
        "hideNavIcons": false,
        "hideNavLabels": false,
        "rightToLeft": false,
        "hideNextButton": true,
        "showCompleteButton": true,
        "inputs": [{
            "name": "participant_id",
            "private": false,
            "label": "Participant ID",
            "innerLabel": "",
            "placeholder": "",
            "hintText": "",
            "type": "text",
            "required": false,
            "disabled": true,
            "hidden": false,
            "invalid": false,
            "incomplete": true,
            "value": "810005",
            "min": "",
            "max": "",
            "questionNumber": "",
            "errorText": "",
            "allowedPattern": "",
            "errorMessage": "",
            "tagName": "TANGY-INPUT"
        }, {
            "name": "treatment_assignment",
            "value": "Experiment",
            "hintText": "",
            "required": false,
            "disabled": true,
            "label": "Treatment Assignment",
            "optionSelectLabel": "----",
            "secondaryLabel": "",
            "hidden": false,
            "invalid": false,
            "incomplete": true,
            "questionNumber": "",
            "errorText": "",
            "tagName": "TANGY-SELECT"
        }, {
            "name": "bin_mother",
            "private": false,
            "label": "bin-mother",
            "innerLabel": "",
            "placeholder": "",
            "hintText": "",
            "type": "text",
            "required": false,
            "disabled": true,
            "hidden": false,
            "invalid": false,
            "incomplete": true,
            "value": "A",
            "min": "",
            "max": "",
            "questionNumber": "",
            "errorText": "",
            "allowedPattern": "",
            "errorMessage": "",
            "tagName": "TANGY-INPUT"
        }, {
            "name": "bin_infant",
            "private": false,
            "label": "bin-infant",
            "innerLabel": "",
            "placeholder": "",
            "hintText": "",
            "type": "text",
            "required": false,
            "disabled": true,
            "hidden": false,
            "invalid": false,
            "incomplete": true,
            "value": "B",
            "min": "",
            "max": "",
            "questionNumber": "",
            "errorText": "",
            "allowedPattern": "",
            "errorMessage": "",
            "tagName": "TANGY-INPUT"
        }, {
            "name": "sub_studies",
            "value": ["S1", "S4"],
            "hintText": "",
            "atLeast": 0,
            "required": false,
            "disabled": false,
            "label": "Sub Studies",
            "hidden": false,
            "incomplete": true,
            "invalid": false,
            "errorText": "",
            "questionNumber": "",
            "tagName": "TANGY-CHECKBOXES"
        }, {
            "name": "enrollment_date",
            "private": false,
            "label": "Enrollment date:",
            "innerLabel": "",
            "placeholder": "",
            "hintText": "",
            "type": "date",
            "required": true,
            "disabled": false,
            "hidden": false,
            "invalid": false,
            "incomplete": true,
            "value": "2019-12-30",
            "min": "",
            "max": "",
            "questionNumber": "",
            "errorText": "",
            "allowedPattern": "",
            "errorMessage": "",
            "tagName": "TANGY-INPUT"
        }, {
            "name": "enrollment_time",
            "private": false,
            "label": "Enrollment time:",
            "innerLabel": "",
            "placeholder": "",
            "hintText": "",
            "type": "time",
            "required": true,
            "disabled": false,
            "hidden": false,
            "invalid": false,
            "incomplete": true,
            "value": "21:10",
            "min": "",
            "max": "",
            "questionNumber": "",
            "errorText": "",
            "allowedPattern": "",
            "errorMessage": "",
            "tagName": "TANGY-INPUT"
        }, {
            "name": "location",
            "hintText": "",
            "errorText": "",
            "value": [],
            "required": false,
            "invalid": false,
            "showMetaData": false,
            "locationSrc": "./assets/location-list.json",
            "showLevels": "Region,Facility",
            "hidden": false,
            "disabled": false,
            "filterBy": "",
            "filterByGlobal": false,
            "tagName": "TANGY-LOCATION"
        }, {"name": "status", "value": "Enrolled"}, {"name": "firstname", "value": "A"}, {
            "name": "surname",
            "value": "Test"
        }, {"name": "village", "value": "plmp"}, {"name": "ageatenrol", "value": "18"}, {
            "name": "headofhouse",
            "value": "Bob"
        }],
        "open": true,
        "incomplete": true,
        "disabled": false,
        "hidden": false,
        "locked": false,
        "isDirty": false,
        "tagName": "TANGY-FORM-ITEM"
    }],
    "participants": [{
        "id": "714e3ce2-6624-4588-8779-35f3182a4b99",
        "caseRoleId": "mother-role",
        "data": {"firstname": "A", "surname": "Test", "participant_id": "810005"}
    }],
    "disabledEventDefinitionIds": [],
    "events": [{
        "id": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
        "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
        "status": "in-progress",
        "name": "<t-lang en>ANC-Enrollment</t-lang><t-lang fr>ANC-Inscription</t-lang>",
        "estimate": true,
        "caseEventDefinitionId": "event-definition-466788",
        "eventForms": [{
            "id": "15c6da6a-3e65-46f8-9309-ee9ef9324452",
            "complete": true,
            "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
            "participantId": "",
            "caseEventId": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
            "eventFormDefinitionId": "event-form-definition-ece26e",
            "formResponseId": "1de99cde-7a1e-4b51-a653-d0aac88e3f8a"
        }, {
            "id": "1024695d-970c-47c4-9740-d142493195b0",
            "complete": false,
            "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
            "participantId": "714e3ce2-6624-4588-8779-35f3182a4b99",
            "caseEventId": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
            "eventFormDefinitionId": "event-form-definition-574497"
        }, {
            "id": "4da52cc5-9d1d-413b-9914-131bde9c667a",
            "complete": false,
            "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
            "participantId": "714e3ce2-6624-4588-8779-35f3182a4b99",
            "caseEventId": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
            "eventFormDefinitionId": "event-form-definition-c94289"
        }, {
            "id": "2ec54f8b-ed60-4b43-a9a5-7f244f460d9b",
            "complete": false,
            "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
            "participantId": "714e3ce2-6624-4588-8779-35f3182a4b99",
            "caseEventId": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
            "eventFormDefinitionId": "event-form-definition-a5301b"
        }, {
            "id": "f00ec541-9148-44ea-bb19-69d84a97652a",
            "complete": false,
            "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
            "participantId": "714e3ce2-6624-4588-8779-35f3182a4b99",
            "caseEventId": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
            "eventFormDefinitionId": "event-form-definition-z830kj"
        }, {
            "id": "e7423b0d-8d10-4232-b05a-5c0becca391d",
            "complete": false,
            "caseId": "9241df84-7a63-4635-b5a1-f2d19d28e9a4",
            "participantId": "714e3ce2-6624-4588-8779-35f3182a4b99",
            "caseEventId": "bdc67d4f-2910-45ec-96d9-1fbb8aa8a3b6",
            "eventFormDefinitionId": "event-form-definition-z452kj"
        }],
        "startDate": 0
    }],
    "type": "case",
    "caseDefinitionId": "mother-infant-cohort-case",
    "label": "<t-lang en>Mother-Infant Cohort</t-lang><t-lang fr>Cohorte mère-enfant</t-lang>",
    "tangerineModifiedByUserId": "9eb482fb-6c8f-4bba-aa78-080dff1819db",
    "tangerineModifiedByDeviceId": "24653cff-6a21-4176-9500-1827bd68e27b",
    "tangerineModifiedOn": 1577741189690,
    "complete": false
}
