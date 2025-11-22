/**
 * useSwipeGesture Hook - Reusable Swipe Gesture Detection
 *
 * @purpose Detect and track swipe gestures for touch and mouse interactions
 * @design Hybrid threshold (40-50%) + velocity-based (25-30% for fast swipes)
 *
 * FEATURES:
 * - Touch and mouse drag support
 * - Real-time swipe progress tracking (0-1)
 * - Threshold-based commit (40-50% of container width)
 * - Velocity enhancement (fast swipes commit at 25-30%)
 * - Smooth snap-back for incomplete swipes
 * - CSS transform values for animation
 *
 * USAGE:
 * ```tsx
 * const { handlers, swipeState } = useSwipeGesture({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   threshold: 0.4,
 *   velocityThreshold: 0.5
 * });
 *
 * <div {...handlers} style={{ transform: swipeState.transform }}>
 *   Swipeable content
 * </div>
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface SwipeGestureOptions {
  /** Callback when swipe left completes */
  onSwipeLeft: () => void;
  /** Callback when swipe right completes */
  onSwipeRight: () => void;
  /** Threshold as fraction of card width (0-1). Default: 0.4 (40%) */
  threshold?: number;
  /** Velocity threshold for fast swipes (px/ms). Default: 0.5 */
  velocityThreshold?: number;
  /** Minimum horizontal distance to start swipe (px). Default: 20 */
  minDistance?: number;
}

export interface SwipeState {
  /** Whether user is currently swiping */
  isSwiping: boolean;
  /** Current swipe direction (null if not swiping) */
  swipeDirection: 'left' | 'right' | null;
  /** Swipe progress as fraction of threshold (0-1+) */
  swipeProgress: number;
  /** CSS transform string for card position */
  transform: string;
}

interface PointerPosition {
  x: number;
  y: number;
  timestamp: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 0.4,
  velocityThreshold = 0.5,
  minDistance = 20
}: SwipeGestureOptions) => {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeDirection: null,
    swipeProgress: 0,
    transform: ''
  });

  const startPosRef = useRef<PointerPosition | null>(null);
  const currentPosRef = useRef<PointerPosition | null>(null);
  const containerWidthRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  /**
   * Start swipe gesture
   */
  const handleStart = useCallback((clientX: number, clientY: number, containerWidth: number) => {
    startPosRef.current = {
      x: clientX,
      y: clientY,
      timestamp: Date.now()
    };
    currentPosRef.current = {
      x: clientX,
      y: clientY,
      timestamp: Date.now()
    };
    containerWidthRef.current = containerWidth;
    isDraggingRef.current = false; // Wait for minimum distance
  }, []);

  /**
   * Update swipe gesture
   */
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!startPosRef.current) return;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    // Check if we've moved enough horizontally to start swiping
    if (!isDraggingRef.current) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < minDistance) return;

      // Only start if horizontal movement is dominant
      if (Math.abs(deltaX) < Math.abs(deltaY)) {
        // More vertical than horizontal - allow scroll
        startPosRef.current = null;
        return;
      }

      isDraggingRef.current = true;
    }

    // Update current position
    currentPosRef.current = {
      x: clientX,
      y: clientY,
      timestamp: Date.now()
    };

    const containerWidth = containerWidthRef.current;
    const direction: 'left' | 'right' = deltaX < 0 ? 'left' : 'right';
    const progress = Math.abs(deltaX) / (containerWidth * threshold);

    // Calculate rotation (max ±5 degrees)
    const rotation = (deltaX / containerWidth) * 5;

    setSwipeState({
      isSwiping: true,
      swipeDirection: direction,
      swipeProgress: Math.min(progress, 1.2), // Allow overshoot for visual feedback
      transform: `translateX(${deltaX}px) rotate(${rotation}deg)`
    });
  }, [threshold, minDistance]);

  /**
   * End swipe gesture
   */
  const handleEnd = useCallback(() => {
    if (!startPosRef.current || !currentPosRef.current || !isDraggingRef.current) {
      // Reset state
      startPosRef.current = null;
      currentPosRef.current = null;
      isDraggingRef.current = false;
      setSwipeState({
        isSwiping: false,
        swipeDirection: null,
        swipeProgress: 0,
        transform: ''
      });
      return;
    }

    const deltaX = currentPosRef.current.x - startPosRef.current.x;
    const deltaTime = currentPosRef.current.timestamp - startPosRef.current.timestamp;
    const velocity = Math.abs(deltaX) / deltaTime; // px/ms

    const containerWidth = containerWidthRef.current;
    const distanceThreshold = containerWidth * threshold;
    const fastSwipeThreshold = containerWidth * 0.25; // 25% for fast swipes

    // Determine if swipe should commit
    let shouldCommit = false;

    if (velocity >= velocityThreshold && Math.abs(deltaX) >= fastSwipeThreshold) {
      // Fast swipe - commit at lower threshold
      shouldCommit = true;
    } else if (Math.abs(deltaX) >= distanceThreshold) {
      // Standard threshold reached
      shouldCommit = true;
    }

    if (shouldCommit) {
      // Trigger callback
      if (deltaX < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }

    // Reset state (with animation handled by parent component)
    startPosRef.current = null;
    currentPosRef.current = null;
    isDraggingRef.current = false;

    setSwipeState({
      isSwiping: false,
      swipeDirection: null,
      swipeProgress: 0,
      transform: ''
    });
  }, [threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  /**
   * Mouse event handlers
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const containerWidth = e.currentTarget.offsetWidth;
    handleStart(e.clientX, e.clientY, containerWidth);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleMove(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleStart, handleMove, handleEnd]);

  /**
   * State to track element for re-running effect when ref is set
   */
  const [element, setElement] = useState<HTMLElement | null>(null);

  /**
   * Callback ref that triggers re-render when element is attached
   */
  const callbackRef = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  /**
   * Touch event handlers (using native events for passive: false)
   */
  const handleTouchStartNative = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const containerWidth = (e.currentTarget as HTMLElement).offsetWidth;
    handleStart(touch.clientX, touch.clientY, containerWidth);
  }, [handleStart]);

  const handleTouchMoveNative = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current && !startPosRef.current) return;

    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);

    // Prevent scroll if we're swiping and event is cancelable
    if (isDraggingRef.current && e.cancelable) {
      e.preventDefault();
    }
  }, [handleMove]);

  const handleTouchEndNative = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  /**
   * Attach native touch event listeners with { passive: false }
   * This allows preventDefault() to work on touch events
   * Also attach to window for touchend/touchcancel to catch releases outside element
   */
  useEffect(() => {
    if (!element) return;

    // Window-level handlers for touchend/touchcancel to ensure we always reset
    const handleWindowTouchEnd = () => {
      handleEnd();
    };

    element.addEventListener('touchstart', handleTouchStartNative, { passive: true });
    element.addEventListener('touchmove', handleTouchMoveNative, { passive: false });

    // Attach touchend and touchcancel to window to catch all end events
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleWindowTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStartNative);
      element.removeEventListener('touchmove', handleTouchMoveNative);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
    };
  }, [element, handleTouchStartNative, handleTouchMoveNative, handleEnd]);

  return {
    handlers: {
      onMouseDown: handleMouseDown,
    },
    swipeState,
    ref: callbackRef
  };
};
