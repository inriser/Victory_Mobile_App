export const formatPublishedTime = (timestamp) => {
    if (!timestamp) return "Unknown";

    const publishedDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now - publishedDate; // difference in milliseconds
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    // Formatting date for older than 24 hours
    return publishedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const formatPublishedDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


// 24th Nov 2025 11:23 AM
export const formatFullPublishedDateTime = (timestamp) => {
    if (!timestamp) return "Unknown";

    const date = new Date(timestamp);

    const day = date.getDate();
    const suffix = (day) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };

    const formattedDay = `${day}${suffix(day)}`;
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    return `${formattedDay} ${month} ${year} ${formattedHours}:${minutes} ${ampm}`;
};
