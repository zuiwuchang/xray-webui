import { Injectable } from '@angular/core';
import { Message } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
export enum ToastPosition {
  topLeft = 'ptl',
  topCenter = 'ptc',
  topRight = 'ptr',
  bottomLeft = 'pbl',
  bottomCenter = 'pbc',
  bottomRight = 'pbr',
}
export enum Method {
  add,
  addAll,
  clear,
}
export interface Action {
  method: Method
  message?: Message
  messages?: Message[]
  key?: string
}
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor() { }
  private subject = new Subject<Action>()
  get observable(): Observable<Action> {
    return this.subject
  }
  add(message: Message, key?: ToastPosition) {
    if (key === undefined) {
      key = ToastPosition.topRight
    }
    if (message.key === undefined) {
      message.key = key
    }
    this.subject.next({
      method: Method.add,
      message: message,
    })
  }
  addAll(messages: Message[], key?: ToastPosition) {
    if (key === undefined) {
      key = ToastPosition.topRight
    }
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].key === undefined) {
        messages[i].key = key
      }
    }
    this.subject.next({
      method: Method.addAll,
      messages: messages,
    })
  }
  clear(key?: string) {
    this.subject.next({
      method: Method.clear,
      key: key,
    })
  }
}
