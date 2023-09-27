import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { SettingsRoutingModule } from './settings-routing.module';
import { GeneralComponent } from './general/general.component';
import { StrategyComponent } from './strategy/strategy.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { FirewallComponent } from './firewall/firewall.component';


@NgModule({
  declarations: [
    GeneralComponent,
    StrategyComponent,
    SubscriptionComponent,
    FirewallComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    CardModule, ProgressBarModule, MessagesModule, MessageModule,
    ButtonModule, TooltipModule,
    SettingsRoutingModule
  ]
})
export class SettingsModule { }
