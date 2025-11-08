
console.log("[SendMessageHook] Loading SendMessageHook.js");

if (typeof window.NarrowSDK === 'undefined') {
    window.NarrowSDK = {};
}

if (!window.NarrowSDK.SendMessage) {
    window.NarrowSDK.SendMessage = {
        initialized: false,
        originalSendChatMessage: null,

        init: function() {
            if (this.initialized) return;
            this.initialized = true;

            console.log("[SendMessageHook] Initializing...");

            // Wait for the main instance to be available
            const waitForMainInstance = () => {
                if (window.NarrowSDK && window.NarrowSDK.Main && window.NarrowSDK.Main.network && window.NarrowSDK.Main.network.sendChatMessage) {
                    this.hookSendChatMessage();
                } else {
                    setTimeout(waitForMainInstance, 100);
                }
            };

            waitForMainInstance();
        },

        hookSendChatMessage: function() {
            this.originalSendChatMessage = window.NarrowSDK.Main.network.sendChatMessage;
            window.NarrowSDK.Main.network.sendChatMessage = (message) => {
                this.originalSendChatMessage(message);
            };
            console.log("[SendMessageHook] sendChatMessage hooked.");
        }
    };
}

window.NarrowSDK.SendMessage.init();
