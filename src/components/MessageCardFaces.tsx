'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    checklist?: ReactNode;
    faceClassName: string;
    onViewTasks?: () => void;
}

export default function MessageCardFaces({ children, checklist, faceClassName, onViewTasks }: Props) {
    const [showTasks, setShowTasks] = useState(false);
    const flipped = Boolean(checklist) && showTasks;
    const frontButton = useRef<HTMLButtonElement>(null);
    const backButton = useRef<HTMLButtonElement>(null);
    const moveFocus = useRef(false);

    useLayoutEffect(() => {
        if (moveFocus.current) {
            (flipped ? backButton : frontButton).current?.focus({ preventScroll: true });
            moveFocus.current = false;
        }
    }, [flipped]);

    function turn(toTasks: boolean) {
        moveFocus.current = true;
        setShowTasks(toTasks);
        if (toTasks) onViewTasks?.();
    }

    return (
        <article className="flip-card">
            <div className={`flip-card-inner${flipped ? ' flipped' : ''}`}>
                <div className={`flip-card-front ${faceClassName}`} inert={flipped} aria-hidden={flipped}>
                    {children}
                    {checklist && (
                        <div className="flip-card-actions">
                            <button ref={frontButton} type="button" onClick={() => turn(true)}>
                                <span aria-hidden="true">↷</span>임무 보기
                            </button>
                        </div>
                    )}
                </div>
                {checklist && (
                    <div className={`flip-card-back ${faceClassName}`} inert={!flipped} aria-hidden={!flipped}>
                        {checklist}
                        <div className="flip-card-actions">
                            <button ref={backButton} type="button" onClick={() => turn(false)}>
                                <span aria-hidden="true">↶</span>메시지 보기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
