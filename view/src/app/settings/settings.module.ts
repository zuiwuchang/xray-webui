import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    SettingsRoutingModule
  ]
})
export class SettingsModule { }
