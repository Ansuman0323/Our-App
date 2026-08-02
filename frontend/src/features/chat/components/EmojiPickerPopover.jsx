import React from 'react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

export const EmojiPickerPopover = ({ onSelect, isMobile = false, className = "" }) => {
    const wrapperClass =
        className ||
        (isMobile ? 'w-full flex justify-center' : 'absolute top-14 left-0 z-[10020]');

    return (
        <div
            className={`${wrapperClass} flex flex-col flex-1 min-h-0 animate-in fade-in zoom-in-95 duration-200 overflow-hidden rounded-2xl`}
            style={{ boxShadow: className ? undefined : 'var(--shadow-floating)' }}
            onClick={(e) => e.stopPropagation()}
        >
            <EmojiPicker
                onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
                autoFocusSearch={!isMobile}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.NATIVE}
                width="100%"
                height="100%"
                searchDisabled={false}
                skinTonesDisabled={false}
                lazyLoadEmojis={true}
                previewConfig={{ showPreview: false }}
            />
        </div>
    );
};