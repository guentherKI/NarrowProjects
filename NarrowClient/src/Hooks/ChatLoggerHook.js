console.log("[ChatLogger] Starting chat logger hook...");

// Initialize NarrowSDK if it doesn't exist
if (typeof window.NarrowSDK === 'undefined') {
    window.NarrowSDK = {};
}

// Define our chat logger
if (!window.NarrowSDK.ChatLogger) {
    window.NarrowSDK.ChatLogger = {
        initialized: false,
        observer: null,

        init: function() {
            if (this.initialized) return;
            this.initialized = true;

            console.log("[ChatLogger] Initializing chat logger...");
            this.startObserver();
        },

        startObserver: function() {
            const startObserving = () => {
                const chatContainer = document.querySelector(".chat-log-container");
                if (!chatContainer) {
                    console.log("[ChatLogger] Chat container not found, retrying in 1 second...");
                    setTimeout(startObserving, 1000);
                    return;
                }

                console.log("[ChatLogger] Chat container found, starting observer...");

                this.observer = new MutationObserver(mutations => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.classList && node.classList.contains("chat-message-container")) {
                                // We don't need to log here since RecieveFromServerHook.js already handles logging
                                const name = node.querySelector(".chat-message-name")?.innerText || "???";
                                const message = node.querySelector(".chat-message-content div")?.innerText || "";

                                // Instead of logging, we can add custom chat processing here
                                // For example: filtering, storing, or forwarding to other parts of the application
                                
                                // Here you can add additional processing for chat messages
                                // For example, filtering, storing, or forwarding to other parts of the application
                            }
                        }
                    }
                });

                this.observer.observe(chatContainer, { childList: true, subtree: true });
            };

            startObserving();
        },

        changeMessageColor: function(node) {
            if (!window.NarrowSDK.ChatThemes) return;
            const theme = window.NarrowSDK.ChatThemes.getTheme();
            const messageContent = node.querySelector(".chat-message-content div");
            if (messageContent) {
                messageContent.style.color = theme.color;
            }
        },

        changeMessageFont: function(node) {
            if (!window.NarrowSDK.ChatThemes) return;
            const theme = window.NarrowSDK.ChatThemes.getTheme();
            const messageContent = node.querySelector(".chat-message-content div");
            if (messageContent) {
                messageContent.style.fontFamily = theme.font;
            }
        }
    };
}

// Initialize the chat logger
window.NarrowSDK.ChatLogger.init();