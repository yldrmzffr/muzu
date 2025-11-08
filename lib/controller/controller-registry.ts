interface ControllerRegistration {
  target: any;
  path: string;
}

const CONTROLLER_REGISTRY: ControllerRegistration[] = [];

export function registerController(target: any, path: string): void {
  CONTROLLER_REGISTRY.push({target, path});
}
export function getRegisteredControllers(): ControllerRegistration[] {
  return [...CONTROLLER_REGISTRY];
}

export function clearRegistry(): void {
  CONTROLLER_REGISTRY.length = 0;
}
