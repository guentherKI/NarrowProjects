
// Initialize NarrowSDK if it doesn't exist
if (typeof window.NarrowSDK === 'undefined') {
    window.NarrowSDK = {};
}

// Define our chat themes
if (!window.NarrowSDK.ChatThemes) {
    window.NarrowSDK.ChatThemes = {
        initialized: false,
        currentTheme: "default",
        themes: {
            "default": {
                color: "#FF0000", // Default to red
                font: "Arial"
            },
            "blue": {
                color: "#0000FF",
                font: "Verdana"
            },
            "green": {
                color: "#00FF00",
                font: "Helvetica"
            }
        },

        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            console.log("[ChatThemes] Initializing chat themes...");
        },

        getTheme: function() {
            return this.themes[this.currentTheme];
        },

        setTheme: function(themeName) {
            if (this.themes[themeName]) {
                this.currentTheme = themeName;
            } else {
                console.error(`[ChatThemes] Theme "${themeName}" not found.`);
            }
        },

        getAvailableThemes: function() {
            return Object.keys(this.themes);
        }
    };
}

// Initialize the chat themes
window.NarrowSDK.ChatThemes.init();
