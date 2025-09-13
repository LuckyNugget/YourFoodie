import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, Inter_900Black } from '@expo-google-fonts/inter';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function ChatScreen({ navigation }) {
  const [message, setMessage] = useState(''); // State for user input
  const [messages, setMessages] = useState([]); // State for all chat messages
  const [showPrompt, setShowPrompt] = useState(true); // State to control prompt visibility
  const flatListRef = useRef(); // Ref for FlatList to scroll to bottom
  const [fontsLoaded] = useFonts({ // Load the Inter font
    Inter_900Black,
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    // Hide the prompt after first message
    if (showPrompt) {
      setShowPrompt(false);
    }

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Simulate other person responding with the same message
    setTimeout(() => {
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        text: message, // Echo the same message back
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, responseMessage]);
    }, 1000); // 1 second delay for response

    // Clear input
    setMessage('');

    console.log('User typed:', message);
    // Note: Remove or modify this navigation if you want to stay in chat
    // navigation.navigate('Map');
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.otherMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isUser ? styles.userMessageText : styles.otherMessageText
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {showPrompt ? (
        <View style={styles.promptContainer}>
          <Text style={styles.prompt}>Looking for restaurants?...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type here..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
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
    maxWidth: '80%',
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
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
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
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});