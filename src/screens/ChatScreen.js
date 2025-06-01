import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadChatHistory, saveChatHistory } from '../utils/fileUtils';
import { LOCAL_API_URL } from '../utils/apiConfig';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    (async () => {
      const loadedMessages = await loadChatHistory();
      setMessages(loadedMessages);
    })();
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('@userId');
      setUserId(id);
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const saveChatHistoryWrapper = async (updatedMessages) => {
    await saveChatHistory(updatedMessages);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatHistory();
    setRefreshing(false);
  };

  const clearError = () => setError(null);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setError(null);

    const userMessage = {
      messageId: Date.now().toString(),
      sender: userId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage('');

    await saveChatHistoryWrapper(updatedMessages);

    setLoading(true);

    try {
      const response = await fetch(LOCAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2', // Specify the model
          messages: [
            {
              role: 'user',
              content: newMessage.trim(),
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      const aiMessage = {
        messageId: (Date.now() + 1).toString(),
        sender: 'ai',
        message: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, aiMessage];
        saveChatHistory(updatedMessages).catch(err => 
          console.error('Error saving chat history:', err)
        );
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'Failed to send message';

      if (error.message.includes('Network request failed')) {
        errorMessage =
          "Cannot connect to local Llama server. Make sure it's running and accessible.";
      }

      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === userId ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {loading && (
        <ActivityIndicator style={styles.loading} size="large" color="#0000ff" />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          mode="outlined"
          style={styles.input}
          multiline
        />
        <Button
          mode="contained"
          onPress={sendMessage}
          disabled={loading || !newMessage.trim()}
          style={styles.sendButton}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    color: '#000',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    borderRadius: 20,
  },
  loading: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
});

export default ChatScreen;
