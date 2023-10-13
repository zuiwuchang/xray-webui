import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RippleModule } from 'primeng/ripple';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DropdownModule } from 'primeng/dropdown';

import { SettingsRoutingModule } from './settings-routing.module';
import { GeneralComponent } from './general/general.component';
import { StrategyComponent } from './strategy/strategy.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { FirewallComponent } from './firewall/firewall.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    GeneralComponent,
    StrategyComponent,
    SubscriptionComponent,
    FirewallComponent,
  ],
  imports: [
    CommonModule, FormsModule,
    TranslateModule,
    SharedModule,
    CardModule, ProgressBarModule, MessagesModule, MessageModule,
    ButtonModule, TooltipModule, DataViewModule,
    TabViewModule, DialogModule, InputTextareaModule,
    RippleModule, ProgressSpinnerModule, CheckboxModule,
    InputTextModule, ConfirmPopupModule, DropdownModule,
    SettingsRoutingModule
  ]
})
export class SettingsModule { }
