import { SharedModule } from 'src/app/shared/shared.module';
import { DeviceSyncComponent } from './components/device-sync/device-sync.component';
import { DeviceLanguageComponent } from './components/device-language/device-language.component';
import { DeviceRegistrationComponent } from './components/device-registration/device-registration.component';
import { DeviceSetupComponent } from './components/device-setup/device-setup.component';
import { DeviceRoutingModule } from './device-routing.module';
import { DeviceService } from './services/device.service';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevicePasswordComponent } from './components/device-password/device-password.component';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import { RouterModule } from '@angular/router';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    DeviceSetupComponent,
    DeviceRegistrationComponent,
    DeviceLanguageComponent,
    DeviceSyncComponent,
    DevicePasswordComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DeviceRoutingModule,
    MatButtonModule, MatIconModule,
    RouterModule
  ],
  providers: [
    DeviceService
  ]
})
export class DeviceModule { }
