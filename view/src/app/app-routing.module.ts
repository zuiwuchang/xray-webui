import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './app/about/about.component';
import { HomeComponent } from './app/home/home.component';
import { LogComponent } from './app/log/log.component';
import { NotfoundComponent } from './app/notfound/notfound.component';
import { saveGuard } from './core/guard/save.guard';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canDeactivate: [saveGuard]
  },
  {
    path: 'logs',
    component: LogComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
  },
  {
    path: '**',
    component: NotfoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
