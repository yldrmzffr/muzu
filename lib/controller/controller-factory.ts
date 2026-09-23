import {Controller, ControllerDecorator} from './controller.decorator';

export {ControllerDecorator};

/**
 * @deprecated Use global Controller decorator instead of factory class
 * Kept for backward compatibility
 */
export class ControllerFactory {
  Controller: ControllerDecorator = Controller;
}
