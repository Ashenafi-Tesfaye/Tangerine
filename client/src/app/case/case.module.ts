import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaseComponent } from './components/case/case.component';
import { EventComponent } from './components/event/event.component';
//import { FormComponent } from './components/form/form.component';
import { CasesComponent } from './components/cases/cases.component';
import { NewCaseComponent } from './components/new-case/new-case.component';
import { CaseRoutingModule } from './case-routing.module';
import { EventFormComponent } from './components/event-form/event-form.component';
import { CaseBreadcrumbComponent } from './components/case-breadcrumb/case-breadcrumb.component';
import { SharedModule } from '../shared/shared.module'
import { CaseDefinitionsService } from './services/case-definitions.service';
import { CaseService } from './services/case.service';
import { TangyFormsModule } from '../tangy-forms/tangy-forms.module';
import { WindowRef } from '../core/window-ref.service';
import { CaseEventScheduleListComponent } from './components/case-event-schedule-list/case-event-schedule-list.component';
import { CasesService } from './services/cases.service';
import { CaseEventScheduleComponent } from './components/case-event-schedule/case-event-schedule.component';
import { CaseHomeComponent } from './components/case-home/case-home.component';
import { MatTab, MatTabsModule } from '@angular/material';
import { SearchModule } from '../core/search/search.module';
import { FormsModule } from '@angular/forms';
import { CaseEventListItemComponent } from './components/case-event-list-item/case-event-list-item.component';
import { EventFormListItemComponent } from './components/event-form-list-item/event-form-list-item.component';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  imports: [
    FormsModule,
    CaseRoutingModule,
    SharedModule,
    TangyFormsModule,
    MatTabsModule,
    SearchModule,
    CommonModule
  ],
  providers: [
    WindowRef,
    CaseDefinitionsService,
    CaseService,
    CasesService
  ],
  declarations: [
    EventComponent,
    CasesComponent,
    CaseComponent,
    NewCaseComponent,
    EventFormComponent,
    CaseBreadcrumbComponent,
    CaseEventScheduleListComponent,
    CaseEventScheduleComponent,
    CaseHomeComponent,
    CaseEventListItemComponent,
    EventFormListItemComponent
  ]
})
export class CaseModule { }
