import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { i18n } from 'src/app/i18n';
@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss']
})
export class NotfoundComponent implements OnDestroy {
  private closed_ = new Subject<void>()
  constructor(readonly router: Router, readonly translateService: TranslateService) {
    this.notfound = 'page not found:'
    this.url = router.url
    translateService.stream(i18n.notfound).pipe(
      takeUntil(this.closed_),
    ).subscribe((v) => {
      this.notfound = v
    })
    router.events.pipe(
      takeUntil(this.closed_),
    ).subscribe((v) => {
      this.url = router.url
    })
  }
  notfound: string
  url: string
  ngOnDestroy(): void {
    this.closed_.next()
  }
  i18n=i18n
}
