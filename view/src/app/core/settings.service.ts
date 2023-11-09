import { Injectable } from '@angular/core';
import { getItem, setItem } from 'src/internal/local-storage';

export class SettingsString {
  private value_: string
  constructor(private readonly key_: string, val: string) {
    this.value_ = getItem(key_, val)
  }
  get value(): string {
    return this.value_
  }
  set value(val: string) {
    if (val != this.value_) {
      this.value_ = val
      setItem(this.key_, val)
    }
  }
}
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private activeIndex_?: any
  get activeIndex() {
    let v = this.activeIndex_
    if (v === undefined || v === null) {
      const s = getItem('activeIndex') ?? ''
      if (s == '') {
        v = -1
      } else {
        try {
          const o = JSON.parse(s) ?? -1
          if (typeof o === "number" || Array.isArray(o)) {
            v = o
          } else {
            v = -1
          }
        } catch (e) {
          v = -1
          console.warn(e)
        }
      }
      this.activeIndex_ = v
    }
    return v
  }
  set activeIndex(v: any) {
    if (v == this.activeIndex_) {
      return
    }
    this.activeIndex_ = v
    try {
      setItem('activeIndex', JSON.stringify(v))
    } catch (e) {
      console.warn(e)
    }
  }
  theme = new SettingsString(
    "theme",
    "md-dark-deeppurple", // 默認主題
  )
}
/**
 * 定義支持的 ui 主題
 */
export const Themes: Array<{
  title: string
  values?: Array<{
    value: string
    label: string
    src?: string
  }>
}> = [
    {
      title: 'Bootstrap',
      values: [
        {
          label: 'Blue',
          value: 'bootstrap4-light-blue',
          src: 'assets/images/bootstrap4-light-blue.svg',
        },
        {
          label: 'Purple',
          value: 'bootstrap4-light-purple',
          src: 'assets/images/bootstrap4-light-purple.svg',
        },
        {
          label: 'Blue',
          value: 'bootstrap4-dark-blue',
          src: 'assets/images/bootstrap4-dark-blue.svg',
        },
        {
          label: 'Purple',
          value: 'bootstrap4-dark-purple',
          src: 'assets/images/bootstrap4-dark-purple.svg',
        },
      ],
    },
    {
      title: 'Material Design',
      values: [
        {
          label: 'Indigo',
          value: 'md-light-indigo',
          src: 'assets/images/md-light-indigo.svg',
        },
        {
          label: 'Deep Purple',
          value: 'md-light-deeppurple',
          src: 'assets/images/md-light-deeppurple.svg',
        },
        {
          label: 'Indigo',
          value: 'md-dark-indigo',
          src: 'assets/images/md-dark-indigo.svg',
        },
        {
          label: 'Deep Purple',
          value: 'md-dark-deeppurple',
          src: 'assets/images/md-dark-deeppurple.svg',
        },
      ],
    },
    {
      title: 'Material Design Compact',
      values: [
        {
          label: 'Indigo',
          value: 'mdc-light-indigo',
          src: 'assets/images/md-light-indigo.svg',
        },
        {
          label: 'Deep Purple',
          value: 'mdc-light-deeppurple',
          src: 'assets/images/md-light-deeppurple.svg',
        },
        {
          label: 'Indigo',
          value: 'mdc-dark-indigo',
          src: 'assets/images/md-dark-indigo.svg',
        },
        {
          label: 'Deep Purple',
          value: 'mdc-dark-deeppurple',
          src: 'assets/images/md-dark-deeppurple.svg',
        },
      ],
    },
    {
      title: 'Tailwind',
      values: [
        {
          label: 'Tailwind Light',
          value: 'tailwind-light',
          src: 'assets/images/tailwind-light.png',
        },
      ],
    },
    {
      title: 'Fluent UI',
      values: [
        {
          label: 'Fluent Light',
          value: 'fluent-light',
          src: 'assets/images/fluent-light.png',
        },
      ],
    },
    {
      title: 'PrimeOne Design',
      values: [
        {
          label: 'Lara Light Indigo',
          value: 'lara-light-indigo',
          src: 'assets/images/lara-light-indigo.png',
        },
        {
          label: 'Lara Dark Indigo',
          value: 'lara-dark-indigo',
          src: 'assets/images/lara-dark-indigo.png',
        },
        {
          label: 'Lara Light Purple',
          value: 'lara-light-purple',
          src: 'assets/images/lara-light-purple.png',
        },
        {
          label: 'Lara Dark Purple',
          value: 'lara-dark-purple',
          src: 'assets/images/lara-dark-purple.png',
        },
        {
          label: 'Lara Light Blue',
          value: 'lara-light-blue',
          src: 'assets/images/lara-light-blue.png',
        },
        {
          label: 'Lara Dark Blue',
          value: 'lara-dark-blue',
          src: 'assets/images/lara-dark-blue.png',
        },
        {
          label: 'Lara Light Teal',
          value: 'lara-light-teal',
          src: 'assets/images/lara-light-teal.png',
        },
        {
          label: 'Lara Dark Teal',
          value: 'lara-dark-teal',
          src: 'assets/images/lara-dark-teal.png',
        },
      ],
    },
    {
      title: 'PrimeOne Design - Legacy',
      values: [
        {
          label: 'Saga Blue',
          value: 'saga-blue',
          src: 'assets/images/saga-blue.png',
        },
        {
          label: 'Saga Green',
          value: 'saga-green',
          src: 'assets/images/saga-green.png',
        },
        {
          label: 'Saga Orange',
          value: 'saga-orange',
          src: 'assets/images/saga-orange.png',
        },
        {
          label: 'Saga Purple',
          value: 'saga-purple',
          src: 'assets/images/saga-purple.png',
        },
        {
          label: 'vela blue',
          value: 'vela-blue',
          src: 'assets/images/vela-blue.png',
        },
        {
          label: 'vela green',
          value: 'vela-green',
          src: 'assets/images/vela-green.png',
        },
        {
          label: 'vela orange',
          value: 'vela-orange',
          src: 'assets/images/vela-orange.png',
        },
        {
          label: 'vela purple',
          value: 'vela-purple',
          src: 'assets/images/vela-purple.png',
        },

        {
          label: 'Arya Blue',
          value: 'arya-blue',
          src: 'assets/images/arya-blue.png',
        },
        {
          label: 'Arya Green',
          value: 'arya-green',
          src: 'assets/images/arya-green.png',
        },
        {
          label: 'Arya Orange',
          value: 'arya-orange',
          src: 'assets/images/arya-orange.png',
        },
        {
          label: 'Arya Purple',
          value: 'arya-purple',
          src: 'assets/images/arya-purple.png',
        },
      ],
    },
    {
      title: 'Legacy',
      values: [
        {
          label: 'Nova',
          value: 'nova',
          src: 'assets/images/nova.png',
        },
        {
          label: 'Nova Alt',
          value: 'nova-alt',
          src: 'assets/images/nova-alt.png',
        },
        {
          label: 'Nova Accent',
          value: 'nova-accent',
          src: 'assets/images/nova-accent.png',
        },
        {
          label: '',
          value: ''
        },
        {
          label: 'Luna Amber',
          value: 'luna-amber',
          src: 'assets/images/luna-amber.png',
        },
        {
          label: 'Luna Blue',
          value: 'luna-blue',
          src: 'assets/images/luna-blue.png',
        },
        {
          label: 'Luna Green',
          value: 'luna-green',
          src: 'assets/images/luna-green.png',
        },
        {
          label: 'Luna Pink',
          value: 'luna-pink',
          src: 'assets/images/luna-pink.png',
        },
        {
          label: 'Rhea',
          value: 'rhea',
          src: 'assets/images/rhea.png',
        },
      ],
    },
  ]