import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Delay } from 'src/internal/ui';
import { General } from './general';
@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent extends Closed implements OnInit {
  i18n = i18n
  constructor(private readonly httpClient: HttpClient,
  ) {
    super()
  }
  state = State.none
  error = ''
  private data_: General = {
    url: '',
    run: false,
    firewall: false,
    strategy: 1,
    userdata: '',
  }
  data: General = {
    url: '',
    run: false,
    firewall: false,
    strategy: 1,
    userdata: '',
  }
  ngOnInit(): void {
    this.onClickRefresh()
  }
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()

    this.httpClient.get<General>('/api/v1/settings/general').pipe(this.takeUntil()).subscribe({
      next: (resp) => dely.do(() => {
        this.data = resp
        this.data_ = {
          url: resp.url,
          run: resp.run,
          firewall: resp.firewall,
          strategy: resp.strategy,
          userdata: resp.userdata,
        }
        this.state = State.none
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.error = getErrorString(e)
        this.state = State.error
      }),
    })
  }
  disabled = false
  onClickSubmit() {
    if (this.disabled) {
      return
    }
    this.disabled = true
    console.log(this.data)
  }
}
