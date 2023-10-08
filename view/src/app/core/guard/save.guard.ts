import { CanDeactivateFn } from '@angular/router';
export interface Deactivate {
  readonly canDeactivate?: boolean
  notDeactivate?: () => void
}

export const saveGuard: CanDeactivateFn<Deactivate> = (component, currentRoute, currentState, nextState) => {
  const can = component.canDeactivate
  if (can === undefined || can === true) {
    return true
  }
  if (component.notDeactivate) {
    component.notDeactivate()
  }
  return false
}
