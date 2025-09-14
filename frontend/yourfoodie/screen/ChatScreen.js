import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useFonts, Inter_900Black } from '@expo-google-fonts/inter';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const API_BASE_URL = 'http://10.189.36.5:3001/api'; // Change this to your server URL

export default function ChatScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPrompt, setShowPrompt] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentOptions, setCurrentOptions] = useState(null);
  const flatListRef = useRef();
  const [fontsLoaded] = useFonts({
    Inter_900Black,
  });

  // Initialize chat when component mounts
  useEffect(() => {
    initializeChat();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: `user_${Date.now()}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        
        // Add Claude's greeting message
        const claudeMessage = {
          id: Date.now().toString(),
          text: data.message,
          isUser: false,
          options: data.options
        };
        
        setMessages([claudeMessage]);
        setCurrentOptions(data.options);
        setShowPrompt(false);
      } else {
        Alert.alert('Error', 'Failed to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Connection Error', 'Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageToClaude = async (messageText) => {
    if (!sessionId) {
      Alert.alert('Error', 'Chat session not initialized.');
      return;
    }

    try {
      setIsTyping(true);
      
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: messageText
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add Claude's response
        const claudeMessage = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          isUser: false,
          options: data.options,
          restaurants: data.restaurants,
          events: data.events
        };
        
        setMessages(prevMessages => [...prevMessages, claudeMessage]);
        setCurrentOptions(data.options);
        
        // If Claude provided restaurant data, you might want to do something with it
        if (data.restaurants && data.restaurants.length > 0) {
          console.log('Received restaurants:', data.restaurants);
        }
        
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
  
    // Hide the prompt after first message
    if (showPrompt) {
      setShowPrompt(false);
    }
  
    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
    };
  
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setCurrentOptions(null);
  
    // Detect if this is a map request
    const locationQuery = detectMapRequest(message);
    if (locationQuery) {
      navigation.navigate("Map", { locationQuery, userMessage: message });
      setMessage('');
      return;
    }
  
    // Clear input immediately for better UX
    const messageToSend = message;
    setMessage('');
  
    // Send to Claude
    await sendMessageToClaude(messageToSend);
  };

  const handleOptionSelect = async (option) => {
    // Add user's option selection as a message
    const userMessage = {
      id: Date.now().toString(),
      text: option,
      isUser: true,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setCurrentOptions(null);

    // Send to Claude
    await sendMessageToClaude(option);
  };

  const detectMapRequest = (text) => {
    const mapKeywords = ['map', 'show me', 'location', 'where is', 'navigate', 'directions'];
    const lowerText = text.toLowerCase();
    
    const hasMapKeyword = mapKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasMapKeyword) {
      const locationPatterns = [
        /(?:show me|where is|map of|navigate to)\s+(.+?)(?:\s|$)/i,
        /(.+?)\s+(?:on|in)\s+(?:the\s+)?map/i,
        /location of\s+(.+)/i
      ];
      
      for (let pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      return text.replace(/\b(map|show me|location|where is|navigate|directions)\b/gi, '').trim();
    }
    
    return null;
  };

  const renderOptions = (options) => {
    if (!options || !Array.isArray(options)) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.optionsContainer}
        contentContainerStyle={styles.optionsContent}
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleOptionSelect(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.otherMessage,
      item.isError && styles.errorMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isUser ? styles.userMessageText : styles.otherMessageText,
        item.isError && styles.errorMessageText
      ]}>
        {item.text}
      </Text>
      
      {/* Show options if this is the last message and has options */}
      {item.options && messages[messages.length - 1].id === item.id && 
        renderOptions(item.options)
      }
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.otherMessage]}>
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>Thinking... </Text>
          <ActivityIndicator size="small" color="#666" style={styles.typingIndicator} />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Starting conversation with Claude...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {showPrompt ? (
        <View style={styles.promptContainer}>
          <Text style={styles.prompt}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          ListFooterComponent={renderTypingIndicator}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me about restaurants..."
          value={message}
          onChangeText={setMessage}
          multiline
          editable={!isTyping}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (isTyping || !message.trim()) && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={isTyping || !message.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ed',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  prompt: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'Inter_900Black',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '85%',
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  errorMessage: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  errorMessageText: {
    color: '#D63031',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  typingIndicator: {
    marginLeft: 8,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionsContent: {
    paddingRight: 10,
  },
  optionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  optionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    padding: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});