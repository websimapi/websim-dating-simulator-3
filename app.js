import { createApp } from 'vue';

const app = createApp({
    data() {
        return {
            currentScreen: 'start',
            selectedCharacter: null,
            currentLocation: null,
            userInput: '',
            messages: [],
            ttsEnabled: false,
            availableTTSVoices: [],
            conversationHistory: [],
            characters: [
                {
                    id: 1,
                    name: 'Sophia',
                    bio: 'A creative artist with a passion for painting and adventure.',
                    image: null,
                    prompt: 'A beautiful, confident woman with long dark hair and green eyes, in casual trendy clothes, smiling warmly at the camera, high quality portrait',
                    seed: 1234,
                    gender: 'female',
                    voice: null,
                    memories: []
                },
                {
                    id: 2,
                    name: 'Alex',
                    bio: 'A tech entrepreneur who loves hiking and trying new cuisines.',
                    image: null,
                    prompt: 'A handsome man with short brown hair and blue eyes, casual smart outfit, friendly smile, high quality portrait',
                    seed: 2345,
                    gender: 'male',
                    voice: null,
                    memories: []
                },
                {
                    id: 3,
                    name: 'Zoe',
                    bio: 'A free-spirited musician who travels the world collecting melodies.',
                    image: null,
                    prompt: 'A bohemian woman with colorful hair and a carefree smile, artistic style, musical instruments visible, high quality portrait',
                    seed: 3456,
                    gender: 'female',
                    voice: null,
                    memories: []
                },
                {
                    id: 4,
                    name: 'Marcus',
                    bio: 'A professional chef who enjoys extreme sports in his free time.',
                    image: null,
                    prompt: 'A confident man with a muscular build, chef uniform partially visible, adventurous look in his eyes, high quality portrait',
                    seed: 4567,
                    gender: 'male',
                    voice: null,
                    memories: []
                }
            ],
            locations: [
                {
                    id: 1,
                    name: 'Sunset Beach',
                    description: 'A romantic beach with golden sands and a beautiful sunset.',
                    image: null,
                    prompt: 'A romantic beach scene with golden sand and a beautiful sunset over the ocean, palm trees visible, no people',
                    seed: 7890
                },
                {
                    id: 2,
                    name: 'Cozy Café',
                    description: 'A charming café with vintage decor and a relaxed atmosphere.',
                    image: null,
                    prompt: 'A cozy café interior with vintage furniture, warm lighting, coffee cups on wooden tables, no people',
                    seed: 8901
                },
                {
                    id: 3,
                    name: 'Mountain Hike',
                    description: 'A scenic hiking trail with breathtaking mountain views.',
                    image: null,
                    prompt: 'A scenic mountain hiking trail with lush green vegetation, spectacular views, late afternoon lighting, no people',
                    seed: 9012
                },
                {
                    id: 4,
                    name: 'Amusement Park',
                    description: 'A fun-filled amusement park with exciting rides and attractions.',
                    image: null,
                    prompt: 'A colorful amusement park with a ferris wheel, roller coaster and other rides, evening lighting with colorful lights, no people',
                    seed: 1023
                },
                {
                    id: 5,
                    name: 'Art Gallery',
                    description: 'A sophisticated art gallery featuring contemporary exhibits.',
                    image: null,
                    prompt: 'A modern art gallery interior with white walls, contemporary artwork displayed, minimalist design, soft lighting, no people',
                    seed: 2134
                }
            ]
        }
    },
    mounted() {
        this.loadVoices();
        // Initialize character images
        this.characters.forEach(character => {
            this.generateCharacterImage(character);
        });
        
        // Initialize location images
        this.locations.forEach(location => {
            this.generateLocationImage(location);
        });
    },
    methods: {
        loadVoices() {
            // Load available TTS voices
            if ('speechSynthesis' in window) {
                // Wait for voices to be loaded
                speechSynthesis.onvoiceschanged = () => {
                    this.availableTTSVoices = speechSynthesis.getVoices();
                    
                    // Assign voices to characters based on gender
                    this.characters.forEach(character => {
                        this.assignVoiceToCharacter(character);
                    });
                };
                
                // Try to get voices immediately in case they're already loaded
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.availableTTSVoices = voices;
                    this.characters.forEach(character => {
                        this.assignVoiceToCharacter(character);
                    });
                }
            }
        },
        assignVoiceToCharacter(character) {
            // Filter voices by gender preference if possible
            const preferredVoices = this.availableTTSVoices.filter(voice => {
                if (character.gender === 'female') {
                    return voice.name.toLowerCase().includes('female') || 
                           voice.name.toLowerCase().includes('woman') ||
                           voice.name.toLowerCase().includes('girl');
                } else {
                    return voice.name.toLowerCase().includes('male') || 
                           voice.name.toLowerCase().includes('man') ||
                           voice.name.toLowerCase().includes('boy');
                }
            });
            
            // If we found preferred voices, use one of them
            if (preferredVoices.length > 0) {
                character.voice = preferredVoices[Math.floor(Math.random() * preferredVoices.length)];
            } else {
                // Otherwise use a random voice
                character.voice = this.availableTTSVoices[Math.floor(Math.random() * this.availableTTSVoices.length)];
            }
        },
        async generateCharacterImage(character) {
            try {
                const result = await websim.imageGen({
                    prompt: character.prompt,
                    seed: character.seed,
                    aspect_ratio: "1:1"
                });
                
                character.image = result.url;
            } catch (error) {
                console.error('Failed to generate character image:', error);
            }
        },
        async generateLocationImage(location) {
            try {
                const result = await websim.imageGen({
                    prompt: location.prompt,
                    seed: location.seed,
                    aspect_ratio: "16:9"
                });
                
                location.image = result.url;
            } catch (error) {
                console.error('Failed to generate location image:', error);
            }
        },
        selectCharacter(character) {
            this.selectedCharacter = character;
            this.messages = [];
            this.conversationHistory = [];
            this.currentScreen = 'location';
        },
        selectLocation(location) {
            this.currentLocation = location;
            this.currentScreen = 'date';
            
            // Add initial greeting message based on character's memories
            this.addCharacterMemory();
            this.generateCharacterGreeting();
        },
        addCharacterMemory() {
            // Check if the character has visited this location before
            const existingMemory = this.selectedCharacter.memories.find(
                memory => memory.locationId === this.currentLocation.id
            );
            
            if (!existingMemory) {
                // Create a new memory for this location
                this.selectedCharacter.memories.push({
                    locationId: this.currentLocation.id,
                    visitCount: 1,
                    lastVisit: new Date().toISOString(),
                    conversations: []
                });
            } else {
                // Update existing memory
                existingMemory.visitCount += 1;
                existingMemory.lastVisit = new Date().toISOString();
            }
        },
        async generateCharacterGreeting() {
            const memory = this.selectedCharacter.memories.find(
                memory => memory.locationId === this.currentLocation.id
            );
            
            let prompt = `You are ${this.selectedCharacter.name}, and you're on a date at ${this.currentLocation.name}. `;
            
            if (memory.visitCount === 1) {
                prompt += `This is your first time at this location with the user. Greet them warmly and mention something about the location.`;
            } else {
                prompt += `You have been here ${memory.visitCount} times before with the user. Greet them with familiarity, referencing something about your past visits if possible.`;
                
                // Add past conversations for context
                if (memory.conversations.length > 0) {
                    prompt += ` Here are some highlights from your previous conversations: ${memory.conversations.slice(-3).join('. ')}`;
                }
            }
            
            try {
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: prompt
                        }
                    ]
                });
                
                const response = completion.content;
                this.addMessage(response, 'character');
                
                // If TTS is enabled, speak the message
                if (this.ttsEnabled && this.selectedCharacter.voice) {
                    this.speakMessage(response, this.selectedCharacter.voice);
                }
            } catch (error) {
                console.error('Failed to generate greeting:', error);
                this.addMessage("Hi there! It's nice to see you.", 'character');
            }
        },
        async sendMessage() {
            if (!this.userInput.trim()) return;
            
            // Add user message
            this.addMessage(this.userInput, 'user');
            
            // Save input and clear for next message
            const message = this.userInput;
            this.userInput = '';
            
            // Update conversation history
            this.conversationHistory.push({
                role: "user",
                content: message
            });
            
            // Keep conversation history manageable
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }
            
            // Generate character response
            await this.generateCharacterResponse(message);
        },
        async generateCharacterResponse(userMessage) {
            const memory = this.selectedCharacter.memories.find(
                memory => memory.locationId === this.currentLocation.id
            );
            
            let prompt = `You are ${this.selectedCharacter.name}, a character with this bio: "${this.selectedCharacter.bio}". 
            You're on a date with the user at ${this.currentLocation.name} (${this.currentLocation.description}).
            You've been here ${memory.visitCount} time(s) with the user.
            Respond in character to the user's message. Keep your response conversational and relatively short (1-3 sentences).`;
            
            // Add memory context if available
            if (memory.conversations.length > 0) {
                prompt += ` Remember aspects from your previous conversations: ${memory.conversations.slice(-3).join('. ')}`;
            }
            
            try {
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: prompt
                        },
                        ...this.conversationHistory
                    ]
                });
                
                const response = completion.content;
                
                // Update conversation history
                this.conversationHistory.push({
                    role: "assistant",
                    content: response
                });
                
                // Store this conversation in character's memory
                if (memory) {
                    memory.conversations.push(`User: ${userMessage} - You: ${response}`);
                    // Keep memories manageable
                    if (memory.conversations.length > 10) {
                        memory.conversations = memory.conversations.slice(-10);
                    }
                }
                
                this.addMessage(response, 'character');
                
                // If TTS is enabled, speak the message
                if (this.ttsEnabled && this.selectedCharacter.voice) {
                    this.speakMessage(response, this.selectedCharacter.voice);
                }
            } catch (error) {
                console.error('Failed to generate response:', error);
                this.addMessage("I'm not sure how to respond to that right now.", 'character');
            }
        },
        addMessage(text, from) {
            this.messages.push({
                id: Date.now(),
                text,
                from
            });
            
            // Scroll to bottom of chat
            this.$nextTick(() => {
                if (this.$refs.chatMessages) {
                    this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
                }
            });
        },
        speakMessage(text, voice) {
            if (!('speechSynthesis' in window)) return;
            
            // Stop any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = voice;
            utterance.rate = 1;
            utterance.pitch = 1;
            
            speechSynthesis.speak(utterance);
        },
        goToStart() {
            // Stop any ongoing speech
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
            
            this.currentScreen = 'start';
            this.selectedCharacter = null;
            this.currentLocation = null;
            this.messages = [];
            this.conversationHistory = [];
        },
        changeLocation() {
            // Stop any ongoing speech
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
            
            this.currentScreen = 'location';
        },
        backToDate() {
            if (this.currentLocation) {
                this.currentScreen = 'date';
            } else {
                this.currentScreen = 'start';
            }
        }
    }
});

app.mount('#app');

