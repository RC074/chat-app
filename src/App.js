import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  collectionGroup,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import "./App.css";
import chatgptAvatar from "./chatgpt-logo.png";

const App = () => {
  const [messageHistory, setMessageHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
    const fetchMessages = async () => {
      let fetchedMessages = [];
      let history = [];

      // Fetch all botMessage documents
      const botMessagesSnapshot = await getDocs(
        collectionGroup(db, "botMessage")
      );
      botMessagesSnapshot.forEach((botDoc) => {
        fetchedMessages.push({
          role: "bot",
          content: botDoc.data().data,
          timestamp: botDoc.data().timestamp,
        });
      });

      // Fetch all userMessage documents
      const userMessagesSnapshot = await getDocs(
        collectionGroup(db, "userMessage")
      );
      userMessagesSnapshot.forEach((userDoc) => {
        fetchedMessages.push({
          role: "user",
          content: userDoc.data().data,
          timestamp: userDoc.data().timestamp,
        });
      });

      fetchedMessages.sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < fetchedMessages.length; i++) {
        history.push({
          role: fetchedMessages[i].role === "user" ? "user" : "assistant",
          content: fetchedMessages[i].content,
        });
      }
      setMessageHistory(history);
      setMessages(fetchedMessages);
    };

    fetchMessages();
  }, []);

  const saveMessageToFirebase = async (message) => {
    const messageId = Date.now().toString(); // Create a unique ID for each message
    const messageRef = doc(db, "messages", messageId);
    const subCollectionRef = collection(
      messageRef,
      message.role === "user" ? "userMessage" : "botMessage"
    );
    await addDoc(subCollectionRef, {
      data: message.content,
      timestamp: Date.now(),
    });
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);

    let temp = messageHistory;
    temp.push(userMessage);

    console.log(userMessage);
    await setMessageHistory(temp);

    try {
      console.log(messageHistory);
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: messageHistory,
          temperature: 1,
          top_p: 1,
          n: 1,
          stream: false,
          max_tokens: 3000,
          presence_penalty: 0,
          frequency_penalty: 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
          },
        }
      );

      const botMessage = {
        role: "assistant",
        content: response.data.choices[0].message.content.trim(),
      };
      temp = messageHistory;
      temp.push(botMessage);

      const updatedMessages = [...newMessages, botMessage];
      await setMessageHistory(temp);
      // console.log(messageHistory);
      setMessages(updatedMessages);

      await saveMessageToFirebase(userMessage);
      await saveMessageToFirebase(botMessage);
    } catch (error) {
      console.error("Error fetching the response:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      // await saveMessageToFirebase(errorMessage);
    }

    setInput("");
  };

  return (
    <div className="App">
      <div className="chat">
        <div className="chat-title">
          <h1>GPT-3.5 Turbo</h1>
          <figure className="avatar">
            <img src={chatgptAvatar} alt="avatar" />
          </figure>
        </div>
        <div className="messages">
          <div className="messages-content">
            {messages.map((msg, index) =>
              !(msg.role === "user") ? (
                <div
                  className="message"
                  ref={messages.length === index + 1 ? messagesEndRef : null}
                >
                  <figure className="avatar">
                    <img src={chatgptAvatar} alt="avatar" />
                  </figure>
                  {msg.content}
                </div>
              ) : (
                <div
                  ref={messages.length === index + 1 ? messagesEndRef : null}
                  className="message message-personal"
                >
                  {msg.content}
                </div>
              )
            )}
            <div />
          </div>
        </div>
        <div className="message-box">
          <textarea
            type="text"
            className="message-input"
            placeholder="Type message..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            onChange={(e) => setInput(e.target.value)}
            value={input}
          ></textarea>
          <button type="submit" onClick={handleSend} className="message-submit">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
