import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { UserService } from 'src/app/shared/_services/user.service';
import { CasesService } from '../../services/cases.service';
import * as moment from 'moment'
import { FORM_TYPES_INFO } from 'src/app/core/search/search.component';
import { CaseEvent } from '../../classes/case-event.class';
import { TangyFormsInfoService } from 'src/app/tangy-forms/tangy-forms-info-service';
import { TangyForm, TangyFormResponse } from 'src/app/tangy-forms/tangy-form-response.class';
import { SearchDoc, SearchService } from 'src/app/shared/_services/search.service';
import { FormInfo } from 'src/app/tangy-forms/classes/form-info.class';
import { Subject } from 'rxjs';

export const CASE_EVENT_SCHEDULE_LIST_MODE_DAILY = 'CASE_EVENT_SCHEDULE_LIST_MODE_DAILY'
export const CASE_EVENT_SCHEDULE_LIST_MODE_WEEKLY = 'CASE_EVENT_SCHEDULE_LIST_MODE_WEEKLY'

@Component({
  selector: 'app-case-event-schedule-list',
  templateUrl: './case-event-schedule-list.component.html',
  styleUrls: ['./case-event-schedule-list.component.css']
})
export class CaseEventScheduleListComponent implements OnInit {

  formTypesInfo = FORM_TYPES_INFO
  @ViewChild('listEl') listEl: ElementRef
  formsInfo:Array<FormInfo>
  didSearch$ = new Subject()

  private _date = Date.now()
  @Input()
  set date(date:number) {
    this._date = date
    this.calculateEvents()
  }

  private _mode = CASE_EVENT_SCHEDULE_LIST_MODE_DAILY
  @Input()
  set mode(mode:string) {
    this._mode = mode
    this.calculateEvents()
  }

  constructor(
    private casesService:CasesService,
    private userService:UserService,
    private searchService:SearchService,
    private formsInfoService:TangyFormsInfoService
  ) { }

  async ngOnInit() {
  }

  async calculateEvents() {
    let startDate = Date.now()
    let endDate = Date.now()
    let excludeEstimates = false
    if (this._mode === CASE_EVENT_SCHEDULE_LIST_MODE_DAILY) {
      const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
      const beginningOfDayInMS = today.getTime() 
      const endOfDayInMS = beginningOfDayInMS + (1000*60*60*24)
      startDate = beginningOfDayInMS
      endDate = endOfDayInMS
      excludeEstimates = true
    } else if (this._mode === CASE_EVENT_SCHEDULE_LIST_MODE_WEEKLY) {
      const beginningOfWeek = moment(moment(new Date(this._date)).format('YYYY w'), 'YYYY w').unix()*1000
      const endOfWeek = beginningOfWeek + (1000*60*60*24*7)
      startDate = beginningOfWeek
      endDate = endOfWeek
      excludeEstimates = false
    }
    const events = await this.casesService.getEventsByDate(startDate, endDate, excludeEstimates)
    this.render(events)
  }

  async render(events:Array<CaseEvent>) {
    // Get some data together before rendering.
    this.listEl.nativeElement.innerHTML = "Loading..."
    const userDb = this.userService.getUserDatabase(this.userService.getCurrentUser())
    const searchDocs:Array<SearchDoc> = []
    const responses:Array<TangyFormResponse> = []
    const caseIds = events.reduce((caseIds, caseEvent) => caseIds.indexOf(caseEvent.caseId) === -1 ? [...caseIds, caseEvent.caseId] : caseIds, [])
    for (const caseId of caseIds) {
      searchDocs.push(await this.searchService.getIndexedDoc(this.userService.getCurrentUser(), caseId))
      responses.push(await userDb.get(caseId))
    }
    const formsInfo = await this.formsInfoService.getFormsInfo()
    // Render.
    let markup = ``
    let daysOfWeekSeen = []
    for (const event of events) {
      const date = new Date(event.dateStart)
      if (daysOfWeekSeen.indexOf(date.getDate()) == -1) {
        daysOfWeekSeen.push(date.getDate())
        markup += `<h2 class="date">${date.getDate()}<h2>`
      }
      const searchDoc = searchDocs.find(searchDoc => searchDoc._id === event.caseId)
      const response = responses.find(response => response._id === event.caseId) 
      const formTypeInfo = FORM_TYPES_INFO.find(formTypeInfo => formTypeInfo.id === searchDoc.formType)
      const formInfo = formsInfo.find(formInfo => formInfo.id === searchDoc.formId)
      const formId = formInfo.id
      markup += `
        <paper-icon-item class="search-result" open-link="${eval(`\`${formTypeInfo.resumeFormResponseLinkTemplate}\``)}">
          <iron-icon icon="${eval(`\`${formTypeInfo.iconTemplate}\``)}" slot="item-icon"></iron-icon> 
          <paper-item-body two-line>
            <div>
              ${eval(`\`${formInfo.searchSettings.primaryTemplate ? formInfo.searchSettings.primaryTemplate : response._id}\``)}
            </div>
            <div secondary>
              ${eval(`\`${formInfo.searchSettings.secondaryTemplate ? formInfo.searchSettings.secondaryTemplate : formInfo.title}\``)}
            </div>
          </paper-item-body>
        </paper-icon-item>
      `
    }
    this.listEl.nativeElement.innerHTML = markup
    this.didSearch$.next(true)
  }

}
