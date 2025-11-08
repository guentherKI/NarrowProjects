console.log("[Debug] Loading RecieveFromServerHook.js");

// Initialize NarrowSDK if it doesn't exist
if (typeof window.NarrowSDK === 'undefined') {
    window.NarrowSDK = {};
}

// Initialize chat system if it doesn't exist
if (!window.NarrowSDK.Chat) {
    window.NarrowSDK.Chat = {
        lastMessage: null,
        lastSender: null,
        messageHistory: [],
        maxHistory: 50,  // Keep last 50 messages
        
        // Add a new message to history
        addMessage: function(sender, content) {
            this.lastMessage = content;
            this.lastSender = sender;
            this.messageHistory.push({ sender, content, timestamp: Date.now() });
            if (this.messageHistory.length > this.maxHistory) {
                this.messageHistory.shift(); // Remove oldest message
            }
        }
    };
}

// define our network utilities
if (!window.NarrowSDK.NetworkReceive) {
    window.NarrowSDK.NetworkReceive = {
        initialized: false,
        hasInitialMessageBeenSent: false,
        chatObserver: null,
        isSendingMessage: false,

        // Setup chat observer
        setupChatObserver: function() {
            console.log("[Debug] Setting up chat observer");
            // Create a mutation observer to watch for new chat messages
            this.chatObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.classList && node.classList.contains('chat-message-container')) {
                                const nameElement = node.querySelector('.chat-message-name');
                                const messageElement = node.querySelector('.chat-message-content > div:not(.chat-message-name)');
                                
                                if (nameElement && messageElement) {
                                    const sender = nameElement.textContent;
                                    const content = messageElement.innerHTML;
                                    
                                    // Store in chat system
                                    window.NarrowSDK.Chat.addMessage(sender, content);
                                    console.log("[Chat] " + sender + ": " + content);
                                    window.NarrowSDK.NetworkReceive.sendDelayedMessage();
                                }
                            }
                        });
                    }
                });
            });

            // Start observing chat container
            const startObserving = () => {
                const chatContainer = document.querySelector('.chat-log-container');
                if (chatContainer) {
                    console.log("[Debug] Found chat container, starting observation");
                    this.chatObserver.observe(chatContainer, {
                        childList: true,
                        subtree: true
                    });
                } else {
                    console.log("[Debug] Chat container not found, retrying in 1 second");
                    setTimeout(startObserving, 1000);
                }
            };

            startObserving();
        },
        
        // Send welcome message after delay
        sendDelayedMessage: function() {
            if (window.NarrowSDK.NetworkReceive.isSendingMessage) {
                return;
            }
            window.NarrowSDK.NetworkReceive.isSendingMessage = true;

            if (window.NarrowSDK && window.NarrowSDK.Main && window.NarrowSDK.Main.network && window.NarrowSDK.Main.network.sendChatMessage) {
                window.NarrowSDK.Main.network.sendChatMessage("This is an automated message from the hook!");
            }

            setTimeout(() => {
                window.NarrowSDK.NetworkReceive.isSendingMessage = false;
            }, 2000); // Cooldown of 2 seconds
        }
    };
}

// define our replacemethods function that should be called once per page load
window.NarrowSDK.NetworkReceive.ReplaceMethods = function() {
    console.log("[Debug] ReplaceMethods called");
    if (NarrowSDK.NetworkReceive.initialized) {
        console.log("[Debug] Hook already initialized, skipping");
        return;
    }
    console.log("[Debug] Initializing hook...");
    NarrowSDK.NetworkReceive.initialized = true;

    // Store original function
    NarrowSDK.NetworkReceive.originalAddEventListener = EventTarget.prototype.addEventListener;

    // Replace with our proxy to intercept WebSocket messages
    console.log("[Debug] Setting up event listener proxy");
    EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, {
        apply(target, thisArgs, args) {
            if (args[0] == "message") {
                console.log("[Debug] Intercepted message event listener");
                let origFunc = args[1];
                args[1] = function (...hookArgs) {
                    // Call original first
                    origFunc.apply(this, hookArgs);
                    
                    try {
                        if (!hookArgs[0] || !hookArgs[0].currentTarget || !hookArgs[0].currentTarget.url) {
                            return;
                        }
                        
                        if (!hookArgs[0].currentTarget.url.includes("narrow.one/ws")) {
                            return;
                        }
                        
                        let packetBuffer = hookArgs[0].data;
                        const uintArray = new Uint32Array(packetBuffer, 0, Math.floor(packetBuffer.byteLength / 4));
                        
                        // Check if it's a chat message
                        if (uintArray[0] === 5) { // 5 is the chat message type
                            let msg = window.NarrowSDK.Utils.parseStringMessage(packetBuffer);
                            if (msg) {
                                try {
                                    const packet = JSON.parse(msg);
                                    // Get player info if available
                                    if (window.NarrowSDK.Main && window.NarrowSDK.Main.gameManager) {
                                        const game = window.NarrowSDK.Main.gameManager.activeGame;
                                        if (game && game.chat && game.players) {
                                            const player = game.players.get(packet.data.playerId);
                                            const sender = player ? player.name : "Unknown";
                                            const content = packet.data.message;
                                            
                                            // Store in chat system and log
                                            window.NarrowSDK.Chat.addMessage(sender, content);
                                            console.log("[Chat] " + sender + ": " + content);
                                            window.NarrowSDK.NetworkReceive.sendDelayedMessage();
                                        }
                                    }
                                } catch (e) {
                                    console.error("[Debug] Error processing chat message:", e);
                                }
                            }
                        }
                    } catch (e) {
                        console.error("[Debug] Error in message hook:", e);
                    }
                }
            }
            return Reflect.apply(...arguments);
        }
    });

    // Start delayed message timer
    window.NarrowSDK.NetworkReceive.sendDelayedMessage();
    
    // Setup chat observer
    window.NarrowSDK.NetworkReceive.setupChatObserver();
    
    console.log("[Debug] Hook initialization completed");
};

// Hook will be initialized from background.js
