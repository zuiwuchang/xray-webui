import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { i18n } from 'src/app/i18n';
import { Closed, State } from 'src/internal/closed';
import { getErrorString } from 'src/internal/error';
import { Delay } from 'src/internal/ui';

@Component({
  selector: 'app-firewall',
  templateUrl: './firewall.component.html',
  styleUrls: ['./firewall.component.scss']
})
export class FirewallComponent extends Closed implements OnInit {
  i18n = i18n
  constructor(private readonly httpClient: HttpClient) {
    super()
  }
  state = State.none
  error = ''
  message = ''
  ngOnInit(): void {
    this.onClickRefresh()
  }
  onClickRefresh() {
    if (this.state == State.run) {
      return
    }
    this.state = State.run
    const dely = Delay.default()

    this.httpClient.get<GetResponse>('/api/v1/firewall').pipe(this.takeUntil()).subscribe({
      next: (resp) => dely.do(() => {
        this.message = resp.result
        this.state = State.ok
      }),
      error: (e) => dely.do(() => {
        console.warn(e)
        this.error = getErrorString(e)
        this.state = State.error
      }),
    })
  }
}
interface GetResponse {
  result: string
}