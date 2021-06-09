import * as React from 'react';

export declare interface PullFromEdgeProps {
    onPullTop?: () => Promise<any>;
    pullTopContent?: React.ReactElement;
    onPullBottom?: () => Promise<any>;
    pullBottomContent?: React.ReactElement;
    onPullLeft?: () => Promise<any>;
    pullLeftContent?: React.ReactElement;
    onPullRight?: () => Promise<any>;
    pullRightContent?: React.ReactElement;

    children: React.ReactElement<any>;
    pullDetectDistance: number;
    pullTriggerDistance: number;
    ignoreMouseEvent?: boolean;
    ignoreTouchEvent?: boolean;
}

type Position = { x: number; y: number };
type Direction = 'left' | 'right' | 'top' | 'bottom';

const flexCenterStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const pullContainerStyle: React.CSSProperties = {
    ...flexCenterStyle,
    position: 'fixed',
    transition: 'transform .3s, opacity .4s',
};

const pullContentStyle: React.CSSProperties = {
    ...flexCenterStyle,
    height: '3rem',
    width: '3rem',
    margin: '1rem',
    borderRadius: '100%',
    userSelect: 'none',
    background: '#fff',
    boxShadow: '0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%)',
};

export const PullFromEdge: React.FunctionComponent<PullFromEdgeProps> = ({
    children,
    pullDetectDistance = 30,
    pullTriggerDistance = 60,
    onPullBottom,
    onPullLeft,
    onPullRight,
    onPullTop,
    pullTopContent = <span children="↑" style={pullContentStyle} />,
    pullBottomContent = <span children="↓" style={pullContentStyle} />,
    pullLeftContent = <span children="←" style={pullContentStyle} />,
    pullRightContent = <span children="→" style={pullContentStyle} />,
    ignoreMouseEvent = false,
    ignoreTouchEvent = false,
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragRef = React.useRef({
        startPoint: null as Position | null,
        direction: null as Direction | `*${Direction}` | null,
        touchIdentifier: null as number | null,
    });
    const pullTopRef = React.useRef<HTMLDivElement>(null);
    const pullBottomRef = React.useRef<HTMLDivElement>(null);
    const pullLeftRef = React.useRef<HTMLDivElement>(null);
    const pullRightRef = React.useRef<HTMLDivElement>(null);

    const onStart = (evt: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
        if (!dragRef.current.startPoint) {
            dragRef.current.startPoint =
                'touches' in evt
                    ? {
                          x: evt.touches[0].pageX,
                          y: evt.touches[0].pageY,
                      }
                    : {
                          x: evt.pageX,
                          y: evt.pageY,
                      };
            if ('touches' in evt) {
                dragRef.current.touchIdentifier = evt.touches[0].identifier;
            }
        }
    };

    const onMove = (evt: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
        if (dragRef.current.startPoint) {
            const { x, y } = dragRef.current.startPoint;
            const point = 'touches' in evt ? findTouch(evt, dragRef.current.touchIdentifier!) : evt;
            const delta = {
                x: point.pageX - x,
                y: point.pageY - y,
            };

            if (!dragRef.current.direction) {
                const container = containerRef.current!;
                if (Math.abs(delta.y) >= Math.abs(delta.x)) {
                    if (container.scrollTop === 0 && delta.y >= pullDetectDistance) {
                        dragRef.current.direction = onPullTop ? 'top' : '*top';
                    } else if (container.scrollTop === container.scrollHeight - container.clientHeight && -delta.y >= pullDetectDistance) {
                        dragRef.current.direction = onPullBottom ? 'bottom' : '*bottom';
                    }
                } else {
                    if (container.scrollLeft === 0 && delta.x >= pullDetectDistance) {
                        dragRef.current.direction = onPullLeft ? 'left' : '*left';
                    } else if (container.scrollLeft === container.scrollWidth - container.clientWidth && -delta.x >= pullDetectDistance) {
                        dragRef.current.direction = onPullRight ? 'right' : '*right';
                    }
                }
            }

            if (dragRef.current.direction === 'top') {
                const offset = delta.y / pullTriggerDistance;
                pullTopRef.current!.style.opacity = offset.toString();
                pullTopRef.current!.style.transform = `translateY(${between(-100, offset * 100 - 100, 0)}%)`;
            } else if (dragRef.current.direction === 'bottom') {
                const offset = -delta.y / pullTriggerDistance;
                pullBottomRef.current!.style.opacity = offset.toString();
                pullBottomRef.current!.style.transform = `translateY(${between(0, -offset * 100 + 100, 100)}%)`;
            } else if (dragRef.current.direction === 'left') {
                const offset = delta.x / pullTriggerDistance;
                pullLeftRef.current!.style.opacity = offset.toString();
                pullLeftRef.current!.style.transform = `translateX(${between(-100, offset * 100 - 100, 0)}%)`;
            } else if (dragRef.current.direction === 'right') {
                const offset = -delta.x / pullTriggerDistance;
                pullRightRef.current!.style.opacity = offset.toString();
                pullRightRef.current!.style.transform = `translateX(${between(0, -offset * 100 + 100, 100)}%)`;
            }
        }
    };

    const onEnd = async (evt: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
        if (dragRef.current.startPoint) {
            const { x, y } = dragRef.current.startPoint;
            const point = 'touches' in evt ? findTouch(evt, dragRef.current.touchIdentifier!) : evt;
            const delta = {
                x: point.pageX - x,
                y: point.pageY - y,
            };
            if (dragRef.current.direction) {
                if (dragRef.current.direction === 'top') {
                    if (delta.y >= pullTriggerDistance) {
                        await onPullTop!();
                    }
                    pullTopRef.current!.style.opacity = '0';
                    pullTopRef.current!.style.transform = 'translateY(-100%)';
                } else if (dragRef.current.direction === 'bottom') {
                    if (-delta.y >= pullTriggerDistance) {
                        await onPullBottom!();
                    }
                    pullBottomRef.current!.style.opacity = '0';
                    pullBottomRef.current!.style.transform = 'translateY(100%)';
                } else if (dragRef.current.direction === 'left') {
                    if (delta.x >= pullTriggerDistance) {
                        await onPullLeft!();
                    }
                    pullLeftRef.current!.style.opacity = '0';
                    pullLeftRef.current!.style.transform = 'translateX(-100%)';
                } else if (dragRef.current.direction === 'right') {
                    if (-delta.x >= pullTriggerDistance) {
                        await onPullRight!();
                    }
                    pullRightRef.current!.style.opacity = '0';
                    pullRightRef.current!.style.transform = 'translateX(100%)';
                }
            }
            dragRef.current.direction = null;
            dragRef.current.startPoint = null;
        }
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={ignoreTouchEvent ? undefined : onStart}
            onTouchMove={ignoreTouchEvent ? undefined : onMove}
            onTouchEnd={ignoreTouchEvent ? undefined : onEnd}
            onMouseDown={ignoreMouseEvent ? undefined : onStart}
            onMouseMove={ignoreMouseEvent ? undefined : onMove}
            onMouseUp={ignoreMouseEvent ? undefined : onEnd}
            style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative', overscrollBehavior: 'none' }}
        >
            {onPullTop && (
                <div
                    ref={pullTopRef}
                    style={{
                        ...pullContainerStyle,
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: 'translateY(-100%)',
                    }}
                    children={pullTopContent}
                />
            )}
            {onPullBottom && (
                <div
                    ref={pullBottomRef}
                    style={{
                        ...pullContainerStyle,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        transform: 'translateY(100%)',
                    }}
                    children={pullBottomContent}
                />
            )}
            {onPullLeft && (
                <div
                    ref={pullLeftRef}
                    style={{
                        ...pullContainerStyle,
                        left: 0,
                        top: 0,
                        bottom: 0,
                        transform: 'translateX(-100%)',
                    }}
                    children={pullLeftContent}
                />
            )}
            {onPullRight && (
                <div
                    ref={pullRightRef}
                    style={{
                        ...pullContainerStyle,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        transform: 'translateX(100%)',
                    }}
                    children={pullRightContent}
                />
            )}
            {children}
        </div>
    );
};

export default PullFromEdge;

function between(min: number, value: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function findTouch(evt: React.TouchEvent, identifier: number) {
    const defaultTouch = evt.touches[0] ?? evt.changedTouches[0];

    if (!identifier) return defaultTouch;

    for (let i = 0; i < evt.touches.length; ++i) {
        if (evt.touches[i].identifier === identifier) {
            return evt.touches[i];
        }
    }
    for (let i = 0; i < evt.changedTouches.length; ++i) {
        if (evt.changedTouches[i].identifier === identifier) {
            return evt.changedTouches[i];
        }
    }

    return defaultTouch;
}
