import { TouchEvent, useState } from 'react';

interface SwipeInput {
    onSwipedLeft: () => void;
    onSwipedRight: () => void;
}

interface SwipeOutput {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
}

export const useSwipe = (input: SwipeInput): SwipeOutput => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px) 
    const minSwipeDistance = 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            input.onSwipedLeft();
        }
        if (isRightSwipe) {
            input.onSwipedRight();
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};
