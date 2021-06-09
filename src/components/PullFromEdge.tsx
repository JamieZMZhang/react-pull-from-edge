import * as React from 'react';
import styles from './PullFromEdge.module.css';

export declare interface PullFromEdgeProps extends React.HTMLProps<HTMLDivElement> {
	onPullTop?: () => Promise<any>;
	pullTopContent?: React.ReactElement;
	onPullBottom?: () => Promise<any>;
	pullBottomContent?: React.ReactElement;
	onPullLeft?: () => Promise<any>;
	pullLeftContent?: React.ReactElement;
	onPullRight?: () => Promise<any>;
	pullRightContent?: React.ReactElement;

	containerRef?: React.RefObject<HTMLDivElement>;
	children: React.ReactElement<any>;
	pullDetectDistance: number;
	pullTriggerDistance: number;
	ignoreMouseEvent?: boolean;
	ignoreTouchEvent?: boolean;
}

type Position = { x: number; y: number };
type Direction = 'left' | 'right' | 'top' | 'bottom';
type PullState = 'pulled';

export const PullFromEdge: React.FunctionComponent<PullFromEdgeProps> = ({
	children,
	pullDetectDistance = 30,
	pullTriggerDistance = 60,
	onPullBottom,
	onPullLeft,
	onPullRight,
	onPullTop,
	pullTopContent = <span children="↑" className={styles.pullContent} />,
	pullBottomContent = <span children="↓" className={styles.pullContent} />,
	pullLeftContent = <span children="←" className={styles.pullContent} />,
	pullRightContent = <span children="→" className={styles.pullContent} />,
	ignoreMouseEvent = false,
	ignoreTouchEvent = false,
	containerRef: _containerRef,
	...divProps
}) => {
	const containerRef = _containerRef ?? React.useRef(null);
	const dragRef = React.useRef({
		startPoint: null as Position | null,
		direction: null as Direction | false | null,
		touchIdentifier: null as number | null,
		state: null as PullState | null,
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
		if (dragRef.current.startPoint && !dragRef.current.state) {
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
						dragRef.current.direction = onPullTop ? 'top' : false;
					} else if (container.scrollTop === container.scrollHeight - container.clientHeight && -delta.y >= pullDetectDistance) {
						dragRef.current.direction = onPullBottom ? 'bottom' : false;
					}
				} else {
					if (container.scrollLeft === 0 && delta.x >= pullDetectDistance) {
						dragRef.current.direction = onPullLeft ? 'left' : false;
					} else if (container.scrollLeft === container.scrollWidth - container.clientWidth && -delta.x >= pullDetectDistance) {
						dragRef.current.direction = onPullRight ? 'right' : false;
					}
				}
			}
			if (dragRef.current.direction && dragRef.current.state !== 'pulled') {
				if (dragRef.current.direction === 'top') {
					const offset = delta.y / pullTriggerDistance;
					pullTopRef.current!.classList.add(styles.isPulling);
					pullTopRef.current!.style.opacity = offset.toString();
					pullTopRef.current!.style.transform = `translateY(${between(-100, offset * 100 - 100, 0)}%)`;
				} else if (dragRef.current.direction === 'bottom') {
					const offset = -delta.y / pullTriggerDistance;
					pullBottomRef.current!.classList.add(styles.isPulling);
					pullBottomRef.current!.style.opacity = offset.toString();
					pullBottomRef.current!.style.transform = `translateY(${between(0, -offset * 100 + 100, 100)}%)`;
				} else if (dragRef.current.direction === 'left') {
					const offset = delta.x / pullTriggerDistance;
					pullLeftRef.current!.classList.add(styles.isPulling);
					pullLeftRef.current!.style.opacity = offset.toString();
					pullLeftRef.current!.style.transform = `translateX(${between(-100, offset * 100 - 100, 0)}%)`;
				} else if (dragRef.current.direction === 'right') {
					const offset = -delta.x / pullTriggerDistance;
					pullRightRef.current!.classList.add(styles.isPulling);
					pullRightRef.current!.style.opacity = offset.toString();
					pullRightRef.current!.style.transform = `translateX(${between(0, -offset * 100 + 100, 100)}%)`;
				}
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
				dragRef.current.state = 'pulled';
				if (dragRef.current.direction === 'top') {
					pullRightRef.current!.classList.remove(styles.isPulling);
					if (delta.y >= pullTriggerDistance) {
						await onPullTop!();
					}
					pullTopRef.current!.style.opacity = '0';
					pullTopRef.current!.style.transform = 'translateY(-100%)';
				} else if (dragRef.current.direction === 'bottom') {
					pullBottomRef.current!.classList.remove(styles.isPulling);
					if (-delta.y >= pullTriggerDistance) {
						await onPullBottom!();
					}
					pullBottomRef.current!.style.opacity = '0';
					pullBottomRef.current!.style.transform = 'translateY(100%)';
				} else if (dragRef.current.direction === 'left') {
					pullLeftRef.current!.classList.remove(styles.isPulling);
					if (delta.x >= pullTriggerDistance) {
						await onPullLeft!();
					}
					pullLeftRef.current!.style.opacity = '0';
					pullLeftRef.current!.style.transform = 'translateX(-100%)';
				} else if (dragRef.current.direction === 'right') {
					pullRightRef.current!.classList.remove(styles.isPulling);
					if (-delta.x >= pullTriggerDistance) {
						await onPullRight!();
					}
					pullRightRef.current!.style.opacity = '0';
					pullRightRef.current!.style.transform = 'translateX(100%)';
				}
			}
			dragRef.current.direction = null;
			dragRef.current.startPoint = null;
			dragRef.current.state = null;
		}
	};

	return (
		<div
			{...divProps}
			ref={containerRef}
			onTouchStart={ignoreTouchEvent ? undefined : onStart}
			onTouchMove={ignoreTouchEvent ? undefined : onMove}
			onTouchEnd={ignoreTouchEvent ? undefined : onEnd}
			onMouseDown={ignoreMouseEvent ? undefined : onStart}
			onMouseMove={ignoreMouseEvent ? undefined : onMove}
			onMouseUp={ignoreMouseEvent ? undefined : onEnd}
			className={`${styles.root} ${divProps.className}`}
		>
			{onPullTop && (
				<div
					ref={pullTopRef}
					className={styles.pullContainer}
					style={{
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
					className={styles.pullContainer}
					style={{
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
					className={styles.pullContainer}
					style={{
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
					className={styles.pullContainer}
					style={{
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
