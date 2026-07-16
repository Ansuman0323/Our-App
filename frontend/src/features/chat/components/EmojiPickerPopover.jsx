import React from 'react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

export const EmojiPickerPopover = ({ onSelect, isMobile = false, className }) => {

    // If a custom className is passed, use it completely. 
    // Otherwise fallback to the existing menu-based positions to avoid breaking Reactions.
    const positionClass = className || (isMobile ? 'w-full flex justify-center' : 'absolute top-14 left-0 z-[60]');

    return (
        <div
            className={`${positionClass} animate-in fade-in zoom-in-95 duration-200`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                <EmojiPicker
                    onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
                    autoFocusSearch={!isMobile}
                    theme={Theme.LIGHT}
                    emojiStyle={EmojiStyle.NATIVE}
                    width={isMobile ? '100%' : 310}
                    height={isMobile ? 400 : 350}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    lazyLoadEmojis={true}
                    previewConfig={{ showPreview: false }}
                />
            </div>
        </div>
    );
};