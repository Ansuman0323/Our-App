/**
 * Handles downloading and opening files.
 * Architected to be easily replaceable with native mobile APIs 
 * (e.g., @capacitor/filesystem & @capacitor/file-opener) in the future.
 */
export const FileDownloadHandler = {
    openOrDownload: async (attachment) => {
        if (!attachment || !attachment.url) throw new Error("No URL provided");

        // FUTURE CAPACITOR IMPLEMENTATION:
        // if (Capacitor.isNativePlatform()) {
        //     const { path } = await Filesystem.downloadFile({ url: attachment.url, ... });
        //     await FileOpener.open({ filePath: path, contentType: attachment.mime_type });
        //     return true;
        // }

        // WEB FALLBACK:
        try {
            const link = document.createElement('a');
            link.href = attachment.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            // Suggest a filename if available
            if (attachment.file_name) {
                link.download = attachment.file_name;
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error("Failed to open file", error);
            throw error;
        }
    }
};