import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import QRCode from 'qrcode'

@Component({
  selector: 'app-qr',
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.scss']
})
export class QrComponent implements AfterViewInit {
  constructor(public readonly config: DynamicDialogConfig<string>) {
  }
  @ViewChild("canvas")
  private _canvas?: ElementRef
  ngAfterViewInit() {
    QRCode.toCanvas(this._canvas!.nativeElement, this.config.data ?? '')
  }
}
