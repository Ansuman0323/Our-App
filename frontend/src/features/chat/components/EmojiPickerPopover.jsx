import React from 'react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

export const EmojiPickerPopover = ({
    onSelect,
    isMobile = false,
    className = ""
}) => {

    // If no custom className is supplied (used by reactions),
    // fall back to the old floating positioning.
    const wrapperClass =
        className ||
        (isMobile
            ? 'w-full flex justify-center'
            : 'absolute top-14 left-0 z-[60]');

    return (
        <div
            className={`${wrapperClass} animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
        >
            <EmojiPicker
                onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
                autoFocusSearch={!isMobile}
                theme={Theme.LIGHT}
                emojiStyle={EmojiStyle.NATIVE}

                // Fill the parent container
                width="100%"
                height={300}

                searchDisabled={false}
                skinTonesDisabled={false}
                lazyLoadEmojis={true}
                previewConfig={{ showPreview: false }}
            />
        </div>
    );
};