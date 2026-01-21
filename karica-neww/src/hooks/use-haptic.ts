import { useCallback } from 'react';

type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection';

export const useHaptic = () => {
    const triggerHaptic = useCallback((type: HapticType) => {
        if (!typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            switch (type) {
                case 'success':
                    window.navigator.vibrate([10, 30, 10]);
                    break;
                case 'warning':
                    window.navigator.vibrate([30, 50, 10]);
                    break;
                case 'error':
                    window.navigator.vibrate([50, 100, 50, 100, 50]);
                    break;
                case 'light':
                    window.navigator.vibrate(10);
                    break;
                case 'medium':
                    window.navigator.vibrate(40);
                    break;
                case 'heavy':
                    window.navigator.vibrate(80);
                    break;
                case 'selection':
                    window.navigator.vibrate(15);
                    break;
                default:
                    break;
            }
        }
    }, []);

    return { triggerHaptic };
};
