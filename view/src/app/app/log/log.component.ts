import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { fromEvent, interval } from 'rxjs';
import { ListenerService } from 'src/app/core/listener.service';
import { ScriptLogService } from 'src/app/core/script-log.service';
import { i18n } from 'src/app/i18n';
import { Closed } from 'src/internal/closed';
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';


@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent extends Closed implements AfterViewInit {
  i18n = i18n
  private xterm_?: Terminal
  private fitAddon_?: FitAddon
  private webLinksAddon_?: WebLinksAddon
  constructor(private readonly scriptLogService: ScriptLogService) {
    super()
  }
  override ngOnDestroy(): void {
    this.xterm_?.dispose()
    this.fitAddon_?.dispose()
    this.webLinksAddon_?.dispose()
  }
  @ViewChild("xterm")
  xterm?: ElementRef
  ngAfterViewInit(): void {
    const element = this.xterm?.nativeElement
    if (!element) {
      return
    }

    const xterm = new Terminal({
      cursorBlink: true,
      screenReaderMode: true,
      convertEol: true,
      disableStdin: true,
    })

    this.xterm_ = xterm

    const fitAddon = new FitAddon()
    this.fitAddon_ = fitAddon
    xterm.loadAddon(fitAddon)
    const webLinksAddon = new WebLinksAddon()
    this.webLinksAddon_ = webLinksAddon
    xterm.loadAddon(webLinksAddon)
    xterm.open(element)
    fitAddon.fit()

    fromEvent(window, 'resize').pipe(
      this.takeUntil(),
    ).subscribe(() => {
      fitAddon.fit()
    })
    interval(1000).pipe(this.takeUntil()).subscribe({
      next: () => {
        fitAddon.fit()
      }
    })

    this.scriptLogService.stream.pipe(this.takeUntil()).subscribe({
      next: (data) => {
        if (data) {
          const view = new DataView(data)
          const id = view.getBigUint64(0, true)
          const flag = view.getBigUint64(8, true)
          if (this.flag_ == flag) {
            const o = this.id_
            if (o && id <= o) {
              return
            }
          } else {
            this.flag_ = flag
          }
          this.id_ = id

          xterm.write(new Uint8Array(data, 16))
        }
      },
    })

    xterm.focus()
  }
  private id_?: bigint
  private flag_?: bigint

  onClickClearLog() {
    const xterm = this.xterm_
    if (xterm) {
      xterm.clear()
    }
    this.scriptLogService.clearLog()
  }
}
