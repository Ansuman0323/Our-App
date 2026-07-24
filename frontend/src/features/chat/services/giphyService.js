const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const BASE_URL = "https://api.giphy.com/v1";

const mapGiphyResponse = (data) => {
    return data.map((item) => ({
        id: item.id,
        url:
            item.images.original.webp ??
            item.images.original.url,

        previewUrl:
            item.images.preview_gif?.url ??
            item.images.fixed_height.webp ??
            item.images.fixed_height.url,
        width: parseInt(item.images.original.width, 10),
        height: parseInt(item.images.original.height, 10),
        title: item.title,
    }));
};

export const giphyService = {
    async getTrendingGifs(offset = 0, limit = 20) {
        const res = await fetch(
            `${BASE_URL}/gifs/trending?api_key=${API_KEY}&limit=${limit}&offset=${offset}&rating=g`
        );

        console.log("GIF Status:", res.status);

        const json = await res.json();
        return mapGiphyResponse(json.data);
    },

    async searchGifs(query, offset = 0, limit = 20) {
        const res = await fetch(
            `${BASE_URL}/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
                query
            )}&limit=${limit}&offset=${offset}&rating=g`
        );

        const json = await res.json();
        return mapGiphyResponse(json.data);
    },

    async getTrendingStickers(offset = 0, limit = 20) {
        const res = await fetch(
            `${BASE_URL}/stickers/trending?api_key=${API_KEY}&limit=${limit}&offset=${offset}&rating=g`
        );

        console.log("Sticker Status:", res.status);

        const json = await res.json();
        return mapGiphyResponse(json.data);
    },

    async searchStickers(query, offset = 0, limit = 20) {
        const res = await fetch(
            `${BASE_URL}/stickers/search?api_key=${API_KEY}&q=${encodeURIComponent(
                query
            )}&limit=${limit}&offset=${offset}&rating=g`
        );

        const json = await res.json();
        return mapGiphyResponse(json.data);
    },
};