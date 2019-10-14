import { CASE_EVENT_STATUS_REVIEWED, CASE_EVENT_STATUS_COMPLETED, CASE_EVENT_STATUS_IN_PROGRESS } from './../classes/case-event.class';
import { EventFormDefinition } from './../classes/event-form-definition.class';
import { UserDatabase } from './../../shared/_classes/user-database.class';
import { CaseEventDefinition } from '../classes/case-event-definition.class'
import { Case } from '../classes/case.class'
import { CaseEvent } from '../classes/case-event.class'
import { EventForm } from '../classes/event-form.class'
import { CaseDefinition } from '../classes/case-definition.class';
import { CaseDefinitionsService } from './case-definitions.service';
import * as UUID from 'uuid/v4'
import { TangyFormService } from 'src/app/tangy-forms/tangy-form.service';
import { WindowRef } from 'src/app/core/window-ref.service';
import { Injectable } from '@angular/core';
import { UserService } from 'src/app/shared/_services/user.service';
import { Query } from '../classes/query.class'
import moment from 'moment/src/moment';
import { HttpClient } from '@angular/common/http';
import { CaseEventPointer } from '../case.queries';

@Injectable({
  providedIn: 'root'
})
class CaseService {

  _id:string
  _rev:string
  db:UserDatabase
  case:Case
  caseDefinition:CaseDefinition
  window:any
  
  queryCaseEventDefinitionId: any
  queryEventFormDefinitionId: any
  queryFormId: any

  constructor(
    private tangyFormService: TangyFormService,
    private caseDefinitionsService: CaseDefinitionsService,
    private windowRef: WindowRef,
    private userService:UserService,
    private http:HttpClient
  ) { 
    this.window = this.windowRef.nativeWindow
    
    this.queryCaseEventDefinitionId = 'query-event';
    this.queryEventFormDefinitionId = 'query-form-event';
    this.queryFormId = 'query-form';

  }

  async create(caseDefinitionId) {
    this.caseDefinition = <CaseDefinition>(await this.caseDefinitionsService.load())
      .find(caseDefinition => caseDefinition.id === caseDefinitionId)
    this.case = new Case({caseDefinitionId, events: [], _id: UUID()})
    delete this.case._rev
    const tangyFormContainerEl = this.window.document.createElement('div')
    tangyFormContainerEl.innerHTML = await this.tangyFormService.getFormMarkup(this.caseDefinition.formId)
    const tangyFormEl = tangyFormContainerEl.querySelector('tangy-form') 
    tangyFormEl.style.display = 'none'
    this.window.document.body.appendChild(tangyFormContainerEl)
    this.case.form = tangyFormEl.getProps()
    this.case.items = []
    tangyFormEl.querySelectorAll('tangy-form-item').forEach((item) => {
      this.case.items.push(item.getProps())
    })
    tangyFormEl.querySelectorAll('tangy-form-item')[0].submit()
    this.case.items[0].inputs = tangyFormEl.querySelectorAll('tangy-form-item')[0].inputs
    tangyFormEl.response = this.case
    this.case = {...this.case, ...tangyFormEl.response}
    tangyFormContainerEl.remove()
    await this.setCase(this.case)
    this.case.caseDefinitionId = caseDefinitionId;
    this.case.label = this.caseDefinition.name
    await this.save()
  }

  async setCase(caseInstance) {
    this.case = caseInstance
    this.caseDefinition = (await this.caseDefinitionsService.load())
      .find(caseDefinition => caseDefinition.id === this.case.caseDefinitionId)
 
  }

  async load(id:string) {
    this.db = await this.userService.getUserDatabase(this.userService.getCurrentUser())
    await this.setCase(new Case(await this.db.get(id)))
  }

  async save() {
    this.db = await this.userService.getUserDatabase(this.userService.getCurrentUser())
    await this.db.put(this.case)
    await this.setCase(await this.db.get(this.case._id))
  }

  createEvent(eventDefinitionId:string, createRequiredEventForms = false):CaseEvent {
    const caseEventDefinition = this.caseDefinition
      .eventDefinitions
      .find(eventDefinition => eventDefinition.id === eventDefinitionId)
    const caseEvent = <CaseEvent>{ 
      id: UUID(),
      caseId: this.case._id,
      status: CASE_EVENT_STATUS_IN_PROGRESS,
      name: caseEventDefinition.name,
      estimate: true,
      caseEventDefinitionId: eventDefinitionId,
      dateStart: Date.now() + caseEventDefinition.estimatedTimeFromCaseOpening - (caseEventDefinition.estimatedTimeWindow/2),
      dateEnd: Date.now() + caseEventDefinition.estimatedTimeFromCaseOpening + (caseEventDefinition.estimatedTimeWindow/2),
      eventForms: [],
      startDate: 0
    }
    this.case.events.push(caseEvent)
    if (createRequiredEventForms === true) {
      for (let eventFormDefinition of caseEventDefinition.eventFormDefinitions.filter(eventFormDefinition => eventFormDefinition.required)) {
        this.startEventForm(caseEvent.id, eventFormDefinition.id)
      }
    }
    return caseEvent
  }

  startEvent(eventId) {
    // ??
  }

  async scheduleEvent(eventId, dateStart:number, dateEnd?:number) {
    this.case.events = this.case.events.map(event => {
      return event.id === eventId 
      ? { ...event, ...{ dateStart, dateEnd: dateEnd ? dateEnd : dateStart, estimate: false} }
      : event
    })
    
  }

  startEventForm(caseEventId, eventFormDefinitionId):EventForm {
    const eventForm = <EventForm>{
      id: UUID(), 
      complete: false, 
      caseId: this.case._id, 
      caseEventId, 
      eventFormDefinitionId: eventFormDefinitionId
    }
    this
      .case
      .events
      .find(caseEvent => caseEvent.id === caseEventId)
      .eventForms
      .push(eventForm)
    return eventForm
  }

  markEventFormComplete(caseEventId:string, eventFormId:string) {
    //
    let caseEvent = this
      .case
      .events
      .find(caseEvent => caseEvent.id === caseEventId)
    let eventDefinition = this
      .caseDefinition
      .eventDefinitions
      .find(eventDefinition => eventDefinition.id === caseEvent.caseEventDefinitionId)
    //
    caseEvent
      .eventForms
      .find(eventForm => eventForm.id === eventFormId)
      .complete = true
    //
    // Test this by opening case type 1, second event, filling out two of the second form, should be evrnt incomplete, then the first form, shoud be event complete
    //let eventForms = caseEvent.eventForms.filter(eventForm => eventForm.eventFormDefinitionId === eventDefinition.id)
    let numberOfEventFormsRequired = eventDefinition
      .eventFormDefinitions
      .reduce((acc, eventFormDefinition) => eventFormDefinition.required ? acc + 1 : acc, 0)
    let numberOfUniqueCompleteEventForms = caseEvent
      .eventForms
      .reduce((acc, eventForm) => eventForm.complete 
          ? Array.from(new Set([...acc, eventForm.eventFormDefinitionId])) 
          : acc
        , [])
        .length
    this
      .case
      .events
      .find(caseEvent => caseEvent.id === caseEventId)
      .status = numberOfEventFormsRequired === numberOfUniqueCompleteEventForms ? CASE_EVENT_STATUS_COMPLETED : CASE_EVENT_STATUS_IN_PROGRESS
    // Check to see if all required Events are complete in Case. If so, mark Case complete.
    let numberOfCaseEventsRequired = this.caseDefinition
      .eventDefinitions
      .reduce((acc, definition) => definition.required ? acc + 1 : acc, 0)
    let numberOfUniqueCompleteCaseEvents = this.case
      .events
      .reduce((acc, instance) => instance.status === CASE_EVENT_STATUS_COMPLETED
          ? Array.from(new Set([...acc, instance.caseEventDefinitionId])) 
          : acc
        , [])
        .length
    this
      .case
      .complete = numberOfCaseEventsRequired === numberOfUniqueCompleteCaseEvents ? true : false
  }

  disableEventDefinition(eventDefinitionId) {
    if (this.case.disabledEventDefinitionIds.indexOf(eventDefinitionId) === -1) {
      this.case.disabledEventDefinitionIds.push(eventDefinitionId)
    }
  }

  setVariable(variableName, value) {
    let input = this.case.items[0].inputs.find(input => input.name === variableName)
    if (input) {
      input.value = value
    } else {
      this.case.items[0].inputs.push({name: variableName, value: value})
    }
  }

  getVariable(variableName) {
    return this.case.items[0].inputs.find(input => input.name === variableName)
      ? this.case.items[0].inputs.find(input => input.name === variableName).value
      : undefined
  }

  async getCaseEventsByStatus(status = CASE_EVENT_STATUS_IN_PROGRESS) {
    const cases:Array<Case> = []
    const caseEvents:Array<CaseEvent> = []
    const userDb = await this.userService.getUserDatabase()
    const caseEventPointers:Array<CaseEventPointer> = await userDb.query('caseEventPointersByStatus', {key: status})
    const uniqueCaseIds = caseEventPointers
      .reduce((uniqueCaseIds, caseEventPointer) => uniqueCaseIds.includes(caseEventPointer.caseId)
        ? uniqueCaseIds
        : [...uniqueCaseIds, caseEventPointer.caseId]
      , [])
    for (const caseId of uniqueCaseIds) {
      cases.push(<Case>await userDb.get(caseId))
    }
    for (const caseEventPointer of caseEventPointers) {
      caseEvents.push(
        cases
          .find(caseInstance => caseInstance._id === caseEventPointer.caseId)
          .events
          .find(caseEvent => caseEvent.id === caseEventPointer.caseEventId)
      )
    }
    return caseEvents
  }

  async getQueries (): Promise<Array<Query>> {
    const userDbName = this.userService.getCurrentUser();
    const queryForms = await this.tangyFormService.getResponsesByFormId(this.queryFormId);  
    const queries = Array<Query>();
    for (const queryForm of queryForms) {
      const query = Object.create(Query);
      queryForm.items[0].inputs.map(q => (query[q.name] = q.value));
      if (query.queryStatus === 'Open') {
        queries.push(query);
      }
    }
    return queries;
  }

  async getOpenQueriesCount (): Promise<number> {
    return (await this.getQueries()).length;
  }

  async createQuery (
    { caseId, eventId, formId, formName, formTitle, participantId, variableName, queryType, queryDate, queryText }
      ): Promise<string> {
    caseId = this.case._id;
    let caseEvent = this.case.events
      .find(caseEventInfo => caseEventInfo.caseEventDefinitionId === this.queryCaseEventDefinitionId);

    if (caseEvent === undefined) {
        const newDate = moment(new Date(), 'YYYY-MM-DD').unix() * 1000;
        caseEvent = this.createEvent(this.queryCaseEventDefinitionId);
        await this.scheduleEvent(caseEvent.id, newDate, newDate);
        await this.save();
      } else {
        caseEvent = this.case.events
        .find(caseEventInfo => caseEventInfo.caseEventDefinitionId === this.queryCaseEventDefinitionId);
      }

      const c = this.startEventForm(caseEvent.id, this.queryEventFormDefinitionId);
      await this.save();

      caseEvent = this.case.events.find(c => c.caseEventDefinitionId === this.queryCaseEventDefinitionId);
      const eventForm = caseEvent.eventForms.find(d => d.id === c.id);

      const referringCaseEvent: CaseEvent = this.case.events.find((event) => event.id === eventId);
      const referringEventName = referringCaseEvent.name;
      const formLink = '/case/event/form/' + caseId + '/' + eventId + '/' + formId;
      const queryLink = '/case/event/form/' + caseId + '/' + caseEvent.id + '/' + eventForm.id;

      const tangyFormContainerEl = this.window.document.createElement('div');
      tangyFormContainerEl.innerHTML = await this.tangyFormService.getFormMarkup(this.queryFormId);
      const tangyFormEl = tangyFormContainerEl.querySelector('tangy-form') ;
      tangyFormEl.style.display = 'none';
      this.window.document.body.appendChild(tangyFormContainerEl);

      tangyFormEl.newResponse();

      tangyFormEl.response.items[0].inputs = [
        { name: 'associatedCaseType', value: this.case.label },
        { name: 'associatedCaseId', value: caseId },
        { name: 'associatedEventId', value: eventId },
        { name: 'associatedFormId', value: formId },
        { name: 'associatedCaseName', value: participantId },
        { name: 'associatedEventName', value: referringEventName },
        { name: 'associatedFormName', value: formTitle },
        { name: 'associatedFormLink', value: formLink },
        { name: 'associatedVariable', value: variableName },
        { name: 'queryText', value: queryText },
        { name: 'queryId', value: 'N/A' },
        { name: 'queryDate', value: queryDate },
        { name: 'queryTypeId', value: queryType },
        { name: 'queryResponse', value: '' },
        { name: 'queryResponseDate', value: '' },
        { name: 'queryStatus', value: 'Open' },
        { name: 'queryLink', value: queryLink }
      ];

      //tangyFormEl.store.dispatch({ type: 'FORM_RESPONSE_COMPLETE' });

      this.db = await this.userService.getUserDatabase(this.userService.getCurrentUser());
      await this.db.put(tangyFormEl.response);

      const queryResponseId = tangyFormEl.response._id;
      eventForm.formResponseId = queryResponseId;
      await this.save();

      return queryResponseId;
  }

  getQuestionMarkup(form: string, question: string): Promise<string> {
    return this.tangyFormService.getFormMarkup(form);
  }

  async valueExists(form, variable, value) {
    const formResponses = await this.tangyFormService.getResponsesByFormId(form);
    for (let i = 0; i < formResponses.length; i++) {
      const formVariable = formResponses[i].inputs.find(input => input.name === variable);
      if (formVariable && formVariable.value === value) {
        return true;
      }
    }
    return false;
  }

}

export { CaseService };
