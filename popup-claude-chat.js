const PopUpClaudeAgent = require('./popup-claude-agent');
const readline = require('readline');

class PopUpClaudeChatInterface {
  constructor() {
    this.agent = new PopUpClaudeAgent();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.conversationActive = true;
  }

  // STEP 1: Start the chat session with real Claude AI
  async startChat() {
    console.log("\n" + "=".repeat(60));
    console.log("🍽️  POPUP RESTAURANT ASSISTANT - POWERED BY CLAUDE AI");
    console.log("=".repeat(60));
    console.log("✨ Now featuring real Claude AI intelligence!");
    console.log("Type 'quit' at any time to exit\n");

    try {
      // Start conversation with Claude API
      const greeting = await this.agent.startConversation();
      this.displayMessage(greeting.message);
      
      if (greeting.needsResponse) {
        this.waitForUserInput();
      }
    } catch (error) {
      console.log("❌ Error starting chat:", error.message);
      if (error.message.includes('API key')) {
        console.log("\n🔑 Please make sure you have set your Claude API key!");
        console.log("   Run: export CLAUDE_API_KEY=your-api-key-here");
        console.log("   Or add it to your .env file");
      }
      this.endChat();
    }
  }

  // STEP 2: Handle user input with Claude AI processing
  waitForUserInput() {
    this.rl.question("\n👤 You: ", async (userInput) => {
      if (userInput.toLowerCase().trim() === 'quit') {
        this.endChat();
        return;
      }

      // Show thinking indicator for Claude API calls
      console.log("🤔 Claude is thinking...");

      try {
        // Process user response through real Claude AI
        const response = await this.agent.processResponse(userInput);
        
        // Clear the thinking indicator
        process.stdout.write("\r\x1b[K"); // Clear line
        
        if (response) {
          this.displayMessage(response.message);
          
          // Show options if available
          if (response.options) {
            console.log("\n💡 Quick options:");
            response.options.forEach((option, index) => {
              console.log(`   ${index + 1}. ${option}`);
            });
          }
          
          if (response.needsResponse && this.conversationActive) {
            this.waitForUserInput();
          } else if (response.step === 'recommendations_shown') {
            console.log("\n💬 Feel free to ask follow-up questions, request different options, or say 'quit' to exit.");
            this.waitForUserInput();
          } else {
            this.endChat();
          }
        } else {
          console.log("🤔 I didn't quite understand that. Could you try rephrasing?");
          this.waitForUserInput();
        }
      } catch (error) {
        console.log("❌ Error processing your message:", error.message);
        if (error.message.includes('API key')) {
          console.log("\n🔑 API Key issue detected. Please check your Claude API key setup.");
        } else if (error.message.includes('rate limit')) {
          console.log("\n⏳ Rate limit reached. Please wait a moment and try again.");
        } else {
          console.log("Let's try that again!");
        }
        this.waitForUserInput();
      }
    });
  }

  // STEP 3: Display Claude's messages with enhanced formatting
  displayMessage(message) {
    console.log("\n🤖 Claude:", message);
  }

  // STEP 4: Clean shutdown
  endChat() {
    console.log("\n👋 Thanks for using PopUp with Claude AI! Happy dining! 🍽️✨");
    this.conversationActive = false;
    this.agent.close();
    this.rl.close();
  }
}

// STEP 5: Demo function with real Claude API
async function runClaudeDemo() {
  console.log("🎭 CLAUDE API DEMO: Real AI conversation simulation");
  console.log("=".repeat(60));
  
  const agent = new PopUpClaudeAgent();
  
  try {
    console.log("\n1. 🚀 Starting conversation with Claude AI...");
    const greeting = await agent.startConversation("claude_demo_user");
    console.log("\n🤖 Claude:", greeting.message);
    
    console.log("\n2. 👤 User responds: 'I love Italian food'");
    console.log("⏳ Claude processing...");
    const response1 = await agent.processResponse("I love Italian food");
    console.log("\n🤖 Claude:", response1.message);
    
    console.log("\n3. 👤 User responds: '$$ range, around 20-25 per person'");
    console.log("⏳ Claude processing...");
    const response2 = await agent.processResponse("$$ range, around 20-25 per person");
    console.log("\n🤖 Claude:", response2.message);
    
    console.log("\n4. 👤 User responds: 'I eat out a few times a week'");
    console.log("⏳ Claude processing...");
    const response3 = await agent.processResponse("I eat out a few times a week");
    console.log("\n🤖 Claude:", response3.message);
    
    console.log("\n5. 👤 User responds: 'I loved Tony's Bistro downtown, great atmosphere'");
    console.log("⏳ Claude processing...");
    const response4 = await agent.processResponse("I loved Tony's Bistro downtown, great atmosphere");
    console.log("\n🤖 Claude:", response4.message);
    
    console.log("\n6. 👤 User responds: 'I prefer casual dining'");
    console.log("⏳ Claude processing...");
    const response5 = await agent.processResponse("I prefer casual dining");
    console.log("\n🤖 Claude:", response5.message);
    
    console.log("\n7. 👤 User responds: 'Yes, I love happy hour deals'");
    console.log("⏳ Claude processing...");
    const response6 = await agent.processResponse("Yes, I love happy hour deals");
    console.log("\n🤖 Claude:", response6.message);
    
    console.log("\n8. 👤 User requests: 'Yes, show me restaurants!'");
    console.log("⏳ Claude generating personalized recommendations...");
    const recommendations = await agent.processResponse("Yes, show me restaurants!");
    console.log("\n🤖 Claude:", recommendations.message);
    
    console.log("\n✨ Demo completed! This was a real conversation with Claude AI.");
    
  } catch (error) {
    console.log("❌ Demo error:", error.message);
    if (error.message.includes('API key')) {
      console.log("\n🔑 You need to set up your Claude API key to run this demo.");
      console.log("   1. Get an API key from https://console.anthropic.com/");
      console.log("   2. Set it as environment variable: export CLAUDE_API_KEY=your-key");
      console.log("   3. Run the demo again");
    }
  } finally {
    agent.close();
  }
}

// STEP 6: Setup instructions display
function showSetupInstructions() {
  console.log("\n" + "=".repeat(60));
  console.log("🔑 CLAUDE API SETUP REQUIRED");
  console.log("=".repeat(60));
  console.log("To use the real Claude AI, you need to:");
  console.log("\n1. 📝 Get an API key:");
  console.log("   • Visit https://console.anthropic.com/");
  console.log("   • Sign up or log in");
  console.log("   • Go to Settings → API Keys");
  console.log("   • Create a new API key");
  console.log("\n2. 🔧 Set up your API key:");
  console.log("   Option A: Environment variable");
  console.log("     export CLAUDE_API_KEY=your-api-key-here");
  console.log("   Option B: Create .env file");
  console.log("     echo 'CLAUDE_API_KEY=your-api-key-here' > .env");
  console.log("\n3. 💳 Add billing:");
  console.log("   • Add payment method in console");
  console.log("   • $5-10 should be plenty for testing");
  console.log("\n4. 🚀 Run the chat:");
  console.log("   node popup-claude-chat.js");
  console.log("\n" + "=".repeat(60));
}

// STEP 7: Main execution with setup detection
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--setup')) {
    showSetupInstructions();
  } else if (args.includes('--demo')) {
    runClaudeDemo();
  } else {
    // Check if API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      console.log("\n⚠️  No Claude API key detected!");
      showSetupInstructions();
      console.log("\n🔄 Once you've set up your API key, run: node popup-claude-chat.js");
    } else {
      // Start interactive chat with real Claude AI
      const chatInterface = new PopUpClaudeChatInterface();
      chatInterface.startChat();
    }
  }
}

module.exports = PopUpClaudeChatInterface;
