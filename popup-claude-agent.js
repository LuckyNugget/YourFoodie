const Anthropic = require('@anthropic-ai/sdk');
const RestaurantDatabase = require('./database-helper');

class PopUpClaudeAgent {
  constructor(apiKey = null) {
    // Initialize Anthropic client
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.CLAUDE_API_KEY,
    });
    
    this.db = new RestaurantDatabase();
    this.conversationState = {
      currentUser: null,
      profileBuilding: false,
      profileComplete: false,
      questionsAsked: [],
      userResponses: {},
      currentStep: 'greeting',
      conversationHistory: []
    };
  }

  // STEP 1: Start conversation with real Claude AI
  async startConversation(userId = null) {
    this.conversationState.currentUser = userId || `user_${Date.now()}`;
    this.conversationState.currentStep = 'greeting';
    
    try {
      // Load existing user preferences
      const existingPrefs = await this.db.getUserPreferences(this.conversationState.currentUser);
      if (existingPrefs.length > 0) {
        return await this.generateWelcomeBackMessage(existingPrefs);
      } else {
        return await this.generateGreetingMessage();
      }
    } catch (error) {
      console.log("Error loading user preferences:", error);
      return await this.generateGreetingMessage();
    }
  }

  // STEP 2: Generate greeting using Claude AI
  async generateGreetingMessage() {
    const systemPrompt = `You are Claude, a friendly and knowledgeable restaurant recommendation assistant for PopUp, a service that helps people discover great local restaurants and deals.

Your personality:
- Warm, enthusiastic, and helpful
- Passionate about food and dining experiences  
- Great at asking engaging questions to understand preferences
- Personable but professional

Your goal is to:
1. Greet the user warmly and introduce yourself
2. Explain that you'll ask a few quick questions to understand their dining preferences
3. Ask the FIRST question about cuisine preferences
4. Keep the greeting conversational but concise (2-3 sentences max)

Start by greeting them and asking: "What type of cuisine do you enjoy most? (Italian, Mexican, American, Asian, etc.)"`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Hi! I would like some restaurant recommendations.'
          }
        ],
      });

      this.conversationState.currentStep = 'profile_building';
      this.conversationState.conversationHistory.push({
        role: 'assistant',
        content: message.content[0].text
      });

      return {
        message: message.content[0].text,
        needsResponse: true,
        step: 'profile_building',
        questionType: 'cuisine_preference'
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        message: "Hi there! I'm Claude, your PopUp restaurant guide! I'd love to help you find amazing restaurants. To get started, what type of cuisine do you enjoy most? (Italian, Mexican, American, Asian, etc.)",
        needsResponse: true,
        step: 'profile_building',
        questionType: 'cuisine_preference'
      };
    }
  }

  // STEP 3: Generate welcome back message for returning users
  async generateWelcomeBackMessage(existingPrefs) {
    const prefSummary = this.summarizePreferences(existingPrefs);
    
    const systemPrompt = `You are Claude, a restaurant recommendation assistant. The user is returning and you remember their preferences: ${prefSummary}. 

Greet them warmly as a returning user, mention what you remember about their preferences, and offer to:
1. Give recommendations based on their known preferences
2. Update their preferences if tastes have changed
3. Show current deals and events

Keep it friendly and conversational (2-3 sentences).`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Hi Claude, I\'m back for more restaurant recommendations!'
          }
        ],
      });

      return {
        message: message.content[0].text,
        needsResponse: true,
        step: 'recommendation_ready',
        options: ['Get recommendations now', 'Update my preferences', 'Show me current deals']
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        message: `Welcome back! 🎉 I remember you love ${prefSummary}. Ready to find your next great meal? I can suggest restaurants based on what I know about you, or we can update your preferences if your tastes have changed!`,
        needsResponse: true,
        step: 'recommendation_ready',
        options: ['Get recommendations now', 'Update my preferences', 'Show me current deals']
      };
    }
  }

  // STEP 4: Process user responses with Claude AI intelligence
  async processResponse(userInput) {
    try {
      if (this.conversationState.currentStep === 'profile_building') {
        return await this.handleProfileBuildingWithClaude(userInput);
      } else if (this.conversationState.currentStep === 'recommendation_ready') {
        return await this.handleRecommendationWithClaude(userInput);
      } else if (this.conversationState.currentStep === 'recommendations_shown') {
        return await this.handleFollowUpWithClaude(userInput);
      }
    } catch (error) {
      console.error('Error processing response:', error);
      return {
        message: "I apologize, I'm having trouble processing that right now. Could you try rephrasing your response?",
        needsResponse: true,
        step: this.conversationState.currentStep
      };
    }
  }

  // STEP 5: Handle profile building with Claude's intelligence
  async handleProfileBuildingWithClaude(userInput) {
    // Track the current question type
    const questionFlow = [
      { type: 'cuisine_preference', next: 'budget_range' },
      { type: 'budget_range', next: 'dining_frequency' },
      { type: 'dining_frequency', next: 'last_restaurant' },
      { type: 'last_restaurant', next: 'dining_style' },
      { type: 'dining_style', next: 'deal_interest' },
      { type: 'deal_interest', next: 'complete' }
    ];

    const currentIndex = this.conversationState.questionsAsked.length;
    const currentQuestion = questionFlow[currentIndex];

    if (!currentQuestion) {
      return await this.completeProfileWithClaude();
    }

    // Save the user's response
    this.conversationState.questionsAsked.push(currentQuestion.type);
    this.conversationState.userResponses[currentQuestion.type] = userInput;
    await this.saveUserPreference(currentQuestion.type, userInput);

    // Add to conversation history
    this.conversationState.conversationHistory.push({
      role: 'user',
      content: userInput
    });

    if (currentQuestion.next === 'complete') {
      return await this.completeProfileWithClaude();
    }

    // Get next question from Claude
    const nextQuestionType = currentQuestion.next;
    const systemPrompt = `You are Claude, a restaurant recommendation assistant. You just received the user's response about their ${currentQuestion.type.replace('_', ' ')}. 

Acknowledge their response positively and naturally, then ask the next question:
- cuisine_preference -> budget_range: "What's your typical budget per person? ($ for under $15, $$ for $15-30, $$$ for $30-50, $$$$ for $50+)"
- budget_range -> dining_frequency: "How often do you dine out? (Daily, few times a week, weekly, occasionally)"
- dining_frequency -> last_restaurant: "What was the last restaurant you really enjoyed and why?"
- last_restaurant -> dining_style: "Do you prefer casual spots or more upscale dining experiences?"
- dining_style -> deal_interest: "Are you interested in happy hours, late night deals, or special events?"

Keep the transition natural and conversational. Acknowledge their previous response briefly, then ask the next question.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: systemPrompt,
        messages: this.conversationState.conversationHistory,
      });

      this.conversationState.conversationHistory.push({
        role: 'assistant',
        content: message.content[0].text
      });

      return {
        message: message.content[0].text,
        needsResponse: true,
        step: 'profile_building',
        questionType: nextQuestionType
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      // Fallback responses
      const fallbackQuestions = {
        'budget_range': "Perfect! What's your typical budget per person? ($ for under $15, $$ for $15-30, $$$ for $30-50, $$$$ for $50+)",
        'dining_frequency': "Great! How often do you dine out? (Daily, few times a week, weekly, occasionally)",
        'last_restaurant': "Got it! What was the last restaurant you really enjoyed and why?",
        'dining_style': "Excellent! Do you prefer casual spots or more upscale dining experiences?",
        'deal_interest': "Perfect! Are you interested in happy hours, late night deals, or special events?"
      };

      return {
        message: fallbackQuestions[nextQuestionType] || "Could you tell me more about your preferences?",
        needsResponse: true,
        step: 'profile_building',
        questionType: nextQuestionType
      };
    }
  }

  // STEP 6: Complete profile with Claude's intelligence
  async completeProfileWithClaude() {
    const responses = this.conversationState.userResponses;
    const profileSummary = Object.entries(responses)
      .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
      .join(', ');

    const systemPrompt = `You are Claude, a restaurant recommendation assistant. The user has just completed their preference profile. Here's what you learned about them:

${profileSummary}

Create an enthusiastic summary of their preferences and ask if they're ready for personalized restaurant recommendations. Keep it warm, concise, and exciting - they should feel like you really understand their tastes now.

End by asking if they want to see restaurant recommendations.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `I've completed answering all your questions about my dining preferences.`
          }
        ],
      });

      this.conversationState.currentStep = 'recommendation_ready';

      return {
        message: message.content[0].text,
        needsResponse: true,
        step: 'recommendation_ready',
        options: ['Yes, show me restaurants!', 'Tell me about current deals', 'Update something about my profile']
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        message: `Perfect! I've got a great sense of your taste now! 🎯 Based on what you've told me, I can find restaurants that match your preferences perfectly. Ready for some personalized recommendations?`,
        needsResponse: true,
        step: 'recommendation_ready',
        options: ['Yes, show me restaurants!', 'Tell me about current deals', 'Update something about my profile']
      };
    }
  }

  // STEP 7: Generate intelligent recommendations with Claude
  async handleRecommendationWithClaude(userInput) {
    try {
      // Get user preferences from database
      const preferences = await this.db.getUserPreferences(this.conversationState.currentUser);
      const userProfile = this.analyzeUserPreferences(preferences);

      // Get restaurants from database
      let restaurants = [];
      if (userProfile.cuisinePreference) {
        restaurants = await this.db.getRestaurantsByCuisine(userProfile.cuisinePreference);
      } else {
        restaurants = await this.db.getAllRestaurants();
      }

      // Filter by budget if specified
      if (userProfile.budgetRange) {
        restaurants = restaurants.filter(r => r.price_range === userProfile.budgetRange);
      }

      // Get current events
      const events = await this.db.getActiveEvents();

      // Let Claude generate intelligent recommendations
      const restaurantData = restaurants.slice(0, 3).map(r => ({
        name: r.name,
        cuisine: r.cuisine_type,
        rating: r.rating,
        address: r.address,
        priceRange: r.price_range
      }));

      const eventData = events.slice(0, 3).map(e => ({
        title: e.title,
        restaurant: e.restaurant_name,
        tagline: e.tagline,
        discount: e.discount_percent,
        time: `${e.start_time} - ${e.end_time}`
      }));

      const systemPrompt = `You are Claude, a restaurant recommendation assistant. Based on the user's preferences and the available restaurants/events data, create personalized restaurant recommendations.

User Preferences: ${JSON.stringify(userProfile)}

Available Restaurants: ${JSON.stringify(restaurantData)}

Current Events/Deals: ${JSON.stringify(eventData)}

Create an engaging recommendation response that:
1. References their specific preferences 
2. Explains WHY each restaurant is perfect for them
3. Highlights relevant deals/events they'd love
4. Uses emojis and enthusiastic language
5. Ends by asking if they want more details or other options

Make it personal and exciting - like a knowledgeable friend making recommendations!`;

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userInput
          }
        ],
      });

      this.conversationState.currentStep = 'recommendations_shown';

      return {
        message: message.content[0].text,
        needsResponse: true,
        step: 'recommendations_shown',
        restaurants: restaurants,
        events: events
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        message: "I'd love to give you some great recommendations! Let me check what restaurants match your preferences and get back to you with personalized suggestions.",
        needsResponse: true,
        step: 'recommendation_ready'
      };
    }
  }

  // STEP 8: Handle follow-up questions with Claude's intelligence  
  async handleFollowUpWithClaude(userInput) {
    // Get current restaurant and event data for context
    const restaurants = await this.db.getAllRestaurants();
    const events = await this.db.getActiveEvents();

    const systemPrompt = `You are Claude, a restaurant recommendation assistant. The user is asking a follow-up question after you've shown them restaurant recommendations.

Available restaurants: ${JSON.stringify(restaurants.slice(0, 5))}
Current events: ${JSON.stringify(events.slice(0, 5))}

Respond helpfully to their follow-up question. If they're asking about:
- Specific restaurant details: Provide what you know
- Different cuisine types: Suggest alternatives from the data
- Current deals: Highlight relevant events
- Location/directions: Provide address info
- General questions: Answer knowledgeably

Keep responses conversational and helpful. If you don't have specific information, be honest but offer what you can provide.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userInput
          }
        ],
      });

      return {
        message: message.content[0].text,
        needsResponse: true,
        step: 'recommendations_shown'
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        message: "I'd be happy to help with that! Could you let me know what specific information you're looking for about the restaurants or deals?",
        needsResponse: true,
        step: 'recommendations_shown'
      };
    }
  }

  // Helper functions (same as before but optimized)
  async saveUserPreference(type, value) {
    try {
      await this.db.saveUserPreference(this.conversationState.currentUser, type, value);
    } catch (error) {
      console.log("Error saving preference:", error);
    }
  }

  analyzeUserPreferences(preferences) {
    const profile = {};
    preferences.forEach(pref => {
      if (pref.preference_type === 'cuisine_preference') {
        profile.cuisinePreference = pref.preference_value;
      } else if (pref.preference_type === 'budget_range') {
        profile.budgetRange = pref.preference_value;
      } else if (pref.preference_type === 'dining_style') {
        profile.diningStyle = pref.preference_value;
      } else if (pref.preference_type === 'deal_interest') {
        profile.dealsInterest = pref.preference_value;
      }
    });
    return profile;
  }

  summarizePreferences(preferences) {
    const cuisines = preferences.filter(p => p.preference_type === 'cuisine_preference').map(p => p.preference_value);
    const budget = preferences.filter(p => p.preference_type === 'budget_range').map(p => p.preference_value);
    
    let summary = "";
    if (cuisines.length > 0) summary += cuisines[0];
    if (budget.length > 0) summary += summary ? ` food in the ${budget[0]} range` : `${budget[0]} dining`;
    
    return summary || "great food";
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = PopUpClaudeAgent;
