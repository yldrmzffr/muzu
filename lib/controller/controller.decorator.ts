import {registerController} from './controller-registry';

export type ControllerDecorator = (path?: string) => ClassDecorator;

export const Controller: ControllerDecorator = (path = '') => {
  return (target: any) => {
    Reflect.defineMetadata('path', path, target);
    registerController(target, path);

    return target;
  };
};
