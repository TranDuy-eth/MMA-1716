import * as FileSystem from 'expo-file-system';

const chatHistoryPath = `${FileSystem.documentDirectory}chat_history.json`;
const SERVER_URL = 'http://192.168.1.59:3001';

/**
 * Check if the backup server is accessible
 * @returns {Promise<boolean>}
 */
const isServerAccessible = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/test`);
    return response.ok;
  } catch (error) {
    console.log('Server not accessible:', error.message);
    return false;
  }
};

/**
 * Save chat history to app directory and backup to server
 * @param {Array} messages - The chat messages to save.
 * @returns {Promise<void>} - A promise that resolves when the file is written.
 */
export const saveChatHistory = async (messages) => {
  try {
    const json = JSON.stringify({ messages }, null, 2);
    // Save to app's document directory
    await FileSystem.writeAsStringAsync(chatHistoryPath, json);
    console.log('Chat history saved successfully to document directory.');
    
    // Backup to project directory via server
    const serverAvailable = await isServerAccessible();
    if (!serverAvailable) {
      console.log('Backup server not available, skipping backup');
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/save-chat-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: json,
      });
      
      if (response.ok) {
        console.log('Chat history backed up to project directory');
      } else {
        console.error('Failed to backup chat history:', await response.text());
      }
    } catch (backupError) {
      console.error('Failed to backup chat history:', backupError);
    }
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

/**
 * Load chat history from chat_history.json
 * @returns {Promise<Array>} - A promise that resolves to the chat messages.
 */
export const loadChatHistory = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(chatHistoryPath);
    if (!fileInfo.exists) return [];

    const json = await FileSystem.readAsStringAsync(chatHistoryPath);
    console.log('Chat history loaded from:', chatHistoryPath);
    console.log('Content:', json);
    const data = JSON.parse(json);
    return data.messages || [];
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
};
