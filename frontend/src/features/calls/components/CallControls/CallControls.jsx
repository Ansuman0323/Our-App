import React from 'react';
import './CallControls.css';

function CallControls({
    callType,
    micEnabled,
    cameraEnabled,
    onToggleMute,
    onToggleCamera,
    onSwitchCamera,
    onEndCall,
}) {
    const isVoice = callType === 'voice';

    const buttons = [
        {
            key: 'mute',
            label: micEnabled ? 'Mute' : 'Unmute',
            pressed: !micEnabled,
            onClick: onToggleMute,
            variant: 'default',
            icon: micEnabled ? '\u{1F3A4}' : '\u{1F507}',
            show: true
        },
        {
            key: 'camera',
            label: cameraEnabled ? 'Turn off camera' : 'Turn on camera',
            pressed: !cameraEnabled,
            onClick: onToggleCamera,
            variant: 'default',
            icon: cameraEnabled ? '\u{1F4F9}' : '\u{1F6AB}',
            show: !isVoice
        },
        {
            key: 'switch-camera',
            label: 'Switch camera',
            pressed: undefined,
            onClick: onSwitchCamera,
            variant: 'default',
            icon: '\u{1F504}',
            show: !isVoice
        },
        {
            key: 'end-call',
            label: 'End call',
            pressed: undefined,
            onClick: onEndCall,
            variant: 'danger',
            icon: '\u260E',
            show: true
        },
    ];

    return (
        <div className="cc-controls" role="group" aria-label="Call controls">
            {buttons.filter(btn => btn.show).map((btn) => (
                <button
                    key={btn.key}
                    type="button"
                    className={`cc-button cc-button--${btn.variant}`}
                    onClick={btn.onClick}
                    aria-label={btn.label}
                    aria-pressed={btn.pressed}
                >
                    <span className="cc-button-icon" aria-hidden="true">
                        {btn.icon}
                    </span>
                </button>
            ))}
        </div>
    );
}

export default React.memo(CallControls);