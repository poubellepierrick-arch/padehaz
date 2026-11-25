
import React from 'react';
import { formatDuration } from '../../utils/helpers';

export const getStatDisplay = (val: number, min: number, max: number) => {
    let style: React.CSSProperties = { fontWeight: 'bold' };
    if (val === min && min !== max) style = { ...style, textDecoration: 'underline', textDecorationColor: 'var(--highlight-color)', textDecorationThickness: '2px' };
    else if (val === max && min !== max) style = { ...style, textDecoration: 'underline', textDecorationColor: 'var(--error-color)', textDecorationThickness: '2px' };
    return <span style={style}>{val}</span>;
};

export const getDurationStatDisplay = (ms: number, min: number, max: number) => {
    let style: React.CSSProperties = { fontWeight: 'bold', fontFamily: 'monospace' };
    if (ms === min && min !== max) style = { ...style, textDecoration: 'underline', textDecorationColor: 'var(--highlight-color)', textDecorationThickness: '2px' };
    else if (ms === max && min !== max) style = { ...style, textDecoration: 'underline', textDecorationColor: 'var(--error-color)', textDecorationThickness: '2px' };
    return <span style={style}>{formatDuration(ms)}</span>;
};
