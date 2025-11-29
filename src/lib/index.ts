// Drag and drop config
import {
	type DropAnimation,
	defaultDropAnimationSideEffects,
	useSensors,
	useSensor,
	TouchSensor,
	KeyboardSensor,
	MouseSensor,
	type SensorDescriptor
} from '@dnd-kit-svelte/core';
export const dropAnimation: DropAnimation = {
	sideEffects: defaultDropAnimationSideEffects({
		styles: {
			active: {
				opacity: '0.0'
			}
		}
	})
};

export const sensors = useSensors(
	useSensor(TouchSensor, {
		activationConstraint: {
			delay: 100,
			tolerance: 5
		}
	}) as SensorDescriptor<object>,
	useSensor(MouseSensor, {
		activationConstraint: {
			delay: 0,
			tolerance: 5
		}
	}) as SensorDescriptor<object>,
	useSensor(KeyboardSensor) as SensorDescriptor<object>
);
