import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateProfileGuardService } from '../../shared/_guards/create-profile-guard.service';
import { LoginGuard } from '../../shared/_guards/login-guard.service';
import { SyncRecordsComponent } from './sync-records/sync-records.component';

const routes: Routes = [{
  path: 'sync-records',
  component: SyncRecordsComponent,
  canActivate: [LoginGuard, CreateProfileGuardService]
},
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: []
})
export class SyncRecordsRoutingModule { }
