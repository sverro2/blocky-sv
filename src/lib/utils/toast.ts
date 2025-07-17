import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration?: number;
	dismissible?: boolean;
}

export interface ToastStore {
	toasts: Toast[];
}

function createToastStore() {
	const { subscribe, set, update } = writable<ToastStore>({ toasts: [] });

	return {
		subscribe,
		add: (toast: Omit<Toast, 'id'>) => {
			const id = crypto.randomUUID();
			const newToast: Toast = {
				id,
				duration: 5000,
				dismissible: true,
				...toast
			};

			update((store) => ({
				toasts: [...store.toasts, newToast]
			}));

			// Auto-dismiss after duration
			if (newToast.duration && newToast.duration > 0) {
				setTimeout(() => {
					toastStore.remove(id);
				}, newToast.duration);
			}

			return id;
		},
		remove: (id: string) => {
			update((store) => ({
				toasts: store.toasts.filter((toast) => toast.id !== id)
			}));
		},
		clear: () => {
			set({ toasts: [] });
		},
		success: (message: string, options?: Partial<Toast>) => {
			return toastStore.add({ message, type: 'success', ...options });
		},
		error: (message: string, options?: Partial<Toast>) => {
			return toastStore.add({ message, type: 'error', duration: 8000, ...options });
		},
		warning: (message: string, options?: Partial<Toast>) => {
			return toastStore.add({ message, type: 'warning', ...options });
		},
		info: (message: string, options?: Partial<Toast>) => {
			return toastStore.add({ message, type: 'info', ...options });
		}
	};
}

export const toastStore = createToastStore();

// Convenience functions
export const toast = {
	success: (message: string, options?: Partial<Toast>) => toastStore.success(message, options),
	error: (message: string, options?: Partial<Toast>) => toastStore.error(message, options),
	warning: (message: string, options?: Partial<Toast>) => toastStore.warning(message, options),
	info: (message: string, options?: Partial<Toast>) => toastStore.info(message, options)
};
