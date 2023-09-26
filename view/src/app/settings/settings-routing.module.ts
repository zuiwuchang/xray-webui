import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FirewallComponent } from './firewall/firewall.component';
import { GeneralComponent } from './general/general.component';
import { StrategyComponent } from './strategy/strategy.component';
import { SubscriptionComponent } from './subscription/subscription.component';

const routes: Routes = [
  {
    path: 'general',
    component: GeneralComponent,
  },
  {
    path: 'strategy',
    component: StrategyComponent,
  },
  {
    path: 'subscription',
    component: SubscriptionComponent,
  },
  {
    path: 'firewall',
    component: FirewallComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
