import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { saveGuard } from '../core/guard/save.guard';
import { FirewallComponent } from './firewall/firewall.component';
import { GeneralComponent } from './general/general.component';
import { StrategyComponent } from './strategy/strategy.component';
import { SubscriptionComponent } from './subscription/subscription.component';

const routes: Routes = [
  {
    path: 'general',
    component: GeneralComponent,
    canDeactivate: [saveGuard]
  },
  {
    path: 'strategy',
    component: StrategyComponent,
  },
  {
    path: 'subscription',
    component: SubscriptionComponent,
    canDeactivate: [saveGuard],
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
