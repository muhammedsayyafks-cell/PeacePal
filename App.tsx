import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, Timestamp, Firestore, Unsubscribe } from 'firebase/firestore';
import { LiveSession, LiveServerMessage } from '@google/genai';

import type { Message, AppState, ChatHistoryPart } from './types';
import { phq9Questions, gad7Questions, cssrsFlow } from './constants';
import { getGeminiResponse } from './services/geminiService';
import { connectToLive } from './services/liveService';
import { decode, encode, decodeAudioData } from './utils/audio';

import Header from './components/Header';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import Screener from './components/Screener';
import CrisisFlow from './components/CrisisFlow';
import VoiceControl from './components/VoiceControl';
import ThinkingModeToggle from './components/ThinkingModeToggle';

// --- Firebase Configuration ---
const firebaseConfig = typeof (window as any).__firebase_config !== 'undefined'
  ? JSON.parse((window as any).__firebase_config)
  : { apiKey: "YOUR_API_KEY", authDomain: "YOUR_AUTH_DOMAIN", projectId: "YOUR_PROJECT_ID" };

const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id';

// --- Firebase Initialization ---
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryPart[]>([]);
  const [input, setInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [appState, setAppState] = useState<AppState>('chat');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [currentCssrsKey, setCurrentCssrsKey] = useState('q1');

  // Thinking Mode State
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Voice Session State
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const userTranscriptRef = useRef('');
  const botTranscriptRef = useRef('');

  // --- Firebase Service Functions ---
  const saveMessage = useCallback(async (message: Omit<Message, 'id'>) => {
    if (!db || !userId) return;
    try {
      const docPath = `artifacts/${appId}/users/${userId}/messages`;
      await addDoc(collection(db, docPath), message);
    } catch (error) {
      console.error("Error saving message: ", error);
    }
  }, [userId]);

  // --- Authentication ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
        });
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  
  // --- Message Loading ---
  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;
    
    const docPath = `artifacts/${appId}/users/${userId}/messages`;
    const q = query(collection(db, docPath));
    
    const unsubscribe: Unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      msgs.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
      setMessages(msgs);
      
      const history = msgs.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      } as ChatHistoryPart));
      setChatHistory(history);
    }, (error) => {
      console.error("Error fetching messages: ", error);
    });
    
    return () => unsubscribe();
  }, [isAuthReady, userId]);

  const postBotMessage = useCallback(async (text: string) => {
    const botMessage: Omit<Message, 'id'> = {
      text: text,
      sender: 'bot',
      createdAt: Timestamp.now()
    };
    await saveMessage(botMessage);
  }, [saveMessage]);
  
  const checkTriggers = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    
    const crisisKeywords = ['kill myself', 'end my life', 'suicidal', 'want to die'];
    if (crisisKeywords.some(kw => lowerText.includes(kw))) {
      setAppState('cssrs');
      setCurrentCssrsKey('q1');
      postBotMessage("Thank you for sharing that. It sounds like you're in a lot of pain. To make sure I understand, I need to ask a few specific questions. Your safety is my top priority.");
      return true;
    }
    
    if (lowerText.includes('depressed') || lowerText.includes('depression')) {
      setAppState('phq9');
      setCurrentQuestion(0);
      setAnswers({});
      postBotMessage("I hear that you're feeling depressed. That's a very heavy feeling. I can offer a standard screener called the PHQ-9. It's just a few questions to help get a clearer picture of how you've been feeling. Would you be open to trying that?");
      return true;
    }
    
    if (lowerText.includes('anxious') || lowerText.includes('anxiety') || lowerText.includes('worried')) {
      setAppState('gad7');
      setCurrentQuestion(0);
      setAnswers({});
      postBotMessage("It sounds like you're dealing with a lot of anxiety. That can be overwhelming. I can offer a standard screener called the GAD-7. It's just a few questions to help see what that anxiety has been like for you. Would you be open to trying that?");
      return true;
    }
    
    return false;
  }, [postBotMessage]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !userId) return;
    
    const userMessage: Omit<Message, 'id'> = {
      text: input,
      sender: 'user',
      createdAt: Timestamp.now()
    };
    await saveMessage(userMessage);
    const currentInput = input;
    setInput('');
    
    if (!checkTriggers(currentInput)) {
      setIsBotLoading(true);
      const botText = await getGeminiResponse(currentInput, chatHistory, isThinkingMode);
      await postBotMessage(botText);
      setIsBotLoading(false);
    }
  }, [input, userId, saveMessage, checkTriggers, chatHistory, postBotMessage, isThinkingMode]);

    // --- Live Session Handler ---
    const handleLiveMessage = useCallback(async (message: LiveServerMessage) => {
      if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        userTranscriptRef.current += text;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.sender === 'user' && lastMsg.id.startsWith('live-')) {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...lastMsg, text: userTranscriptRef.current };
            return newMessages;
          } else {
            return [...prev, { id: `live-${crypto.randomUUID()}`, sender: 'user', text: userTranscriptRef.current, createdAt: Timestamp.now() }];
          }
        });
      }
  
      if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        botTranscriptRef.current += text;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.sender === 'bot' && lastMsg.id.startsWith('live-')) {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...lastMsg, text: botTranscriptRef.current };
            return newMessages;
          } else {
            return [...prev, { id: `live-${crypto.randomUUID()}`, sender: 'bot', text: botTranscriptRef.current, createdAt: Timestamp.now() }];
          }
        });
      }
  
      const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
      if (base64Audio && outputAudioContextRef.current) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContextRef.current.destination);
        
        const currentTime = outputAudioContextRef.current.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
        audioSourcesRef.current.add(source);
        source.onended = () => audioSourcesRef.current.delete(source);
      }
  
      if (message.serverContent?.interrupted) {
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
      }
  
      if (message.serverContent?.turnComplete) {
        if (userTranscriptRef.current) {
          await saveMessage({ text: userTranscriptRef.current, sender: 'user', createdAt: Timestamp.now() });
          userTranscriptRef.current = '';
        }
        if (botTranscriptRef.current) {
          await saveMessage({ text: botTranscriptRef.current, sender: 'bot', createdAt: Timestamp.now() });
          botTranscriptRef.current = '';
        }
      }
    }, [saveMessage]);
  
    const stopVoiceSession = useCallback(() => {
      sessionPromiseRef.current?.then(session => session.close());
      micStreamRef.current?.getTracks().forEach(track => track.stop());
      scriptProcessorRef.current?.disconnect();
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
  
      sessionPromiseRef.current = null;
      micStreamRef.current = null;
      scriptProcessorRef.current = null;
      inputAudioContextRef.current = null;
      outputAudioContextRef.current = null;
  
      setIsVoiceSessionActive(false);
      setIsConnecting(false);
    }, []);
  
    const startVoiceSession = useCallback(async () => {
      setIsConnecting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
  
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputAudioContextRef.current = inputCtx;
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputAudioContextRef.current = outputCtx;
  
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;
  
        processor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  
          sessionPromiseRef.current?.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
  
        source.connect(processor);
        processor.connect(inputCtx.destination);
  
        sessionPromiseRef.current = connectToLive({
          onmessage: handleLiveMessage,
          onerror: (e) => { console.error("Live session error:", e); stopVoiceSession(); },
          onclose: () => { stopVoiceSession(); },
        });
        
        await sessionPromiseRef.current;
        setIsConnecting(false);
        setIsVoiceSessionActive(true);
  
      } catch (err) {
        console.error("Failed to start voice session:", err);
        stopVoiceSession();
      }
    }, [handleLiveMessage, stopVoiceSession]);
  
    const handleToggleVoiceSession = useCallback(() => {
      if (isVoiceSessionActive || isConnecting) {
        stopVoiceSession();
      } else {
        startVoiceSession();
      }
    }, [isVoiceSessionActive, isConnecting, startVoiceSession, stopVoiceSession]);

  const finishScreener = useCallback((finalAnswers: { [key: string]: number }) => {
    const score = Object.values(finalAnswers).reduce((sum, val) => sum + val, 0);
    let summary = '';
    
    if (appState === 'phq9') {
      if (score <= 4) summary = "Your score suggests minimal depression.";
      else if (score <= 9) summary = "Your score suggests mild depression.";
      else if (score <= 14) summary = "Your score suggests moderate depression.";
      else if (score <= 19) summary = "Your score suggests moderately severe depression.";
      else summary = "Your score suggests severe depression.";
      
      if (finalAnswers['phq9'] > 0) {
        summary += "\n\nI also see you noted having some thoughts of self-harm. Because your safety is the priority, I need to ask a few more specific questions.";
        postBotMessage(summary);
        setAppState('cssrs');
        setCurrentCssrsKey('q1');
        return;
      }
    } else if (appState === 'gad7') {
      if (score <= 4) summary = "Your score suggests minimal anxiety.";
      else if (score <= 9) summary = "Your score suggests mild anxiety.";
      else if (score <= 14) summary = "Your score suggests moderate anxiety.";
      else summary = "Your score suggests severe anxiety.";
    }
    
    summary += "\n\nThank you for sharing that. This is just a screener, not a diagnosis, but it gives us a better sense of what you're going through. We can talk more about these feelings.";
    postBotMessage(summary);
    setAppState('chat');
    setAnswers({});
    setCurrentQuestion(0);
  }, [appState, postBotMessage]);

  const handleScreenerAnswer = useCallback((questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    const questions = appState === 'phq9' ? phq9Questions : gad7Questions;
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishScreener(newAnswers);
    }
  }, [answers, appState, currentQuestion, finishScreener]);
  
  const handleScreenerInitialResponse = useCallback((response: 'yes' | 'no') => {
    if (response === 'yes') {
      postBotMessage("Great. Over the last 2 weeks, how often have you been bothered by any of the following problems?");
      setAnswers({ initial: 1 }); // Dummy answer to start questions
    } else {
      postBotMessage("That's perfectly okay. We can just talk.");
      setAppState('chat');
    }
  }, [postBotMessage]);
  
  const handleCssrsResponse = useCallback((response: 'yes' | 'no') => {
    const node = cssrsFlow[currentCssrsKey];
    let nextKey = node.next || (response === 'yes' ? node.nextYes : node.nextNo) || '';

    if (!nextKey || !cssrsFlow[nextKey]) {
      console.error("C-SSRS logic error, no next key");
      setAppState('chat');
      return;
    }

    const nextNode = cssrsFlow[nextKey];
    postBotMessage(nextNode.text);
    setCurrentCssrsKey(nextKey);

    if (nextNode.isEnd) {
      setAppState('chat');
      setCurrentCssrsKey('q1');
    }
  }, [currentCssrsKey, postBotMessage]);

  const renderCurrentStateUI = () => {
    switch (appState) {
      case 'phq9':
        return <Screener questions={phq9Questions} currentQuestionIndex={currentQuestion} answers={answers} onInitialResponse={handleScreenerInitialResponse} onAnswer={handleScreenerAnswer} />;
      case 'gad7':
        return <Screener questions={gad7Questions} currentQuestionIndex={currentQuestion} answers={answers} onInitialResponse={handleScreenerInitialResponse} onAnswer={handleScreenerAnswer} />;
      case 'cssrs':
        return <CrisisFlow flow={cssrsFlow} currentKey={currentCssrsKey} onResponse={handleCssrsResponse} />;
      case 'chat':
      default:
        return (
            <div className='space-y-2'>
                <div className="flex items-center space-x-2">
                    <ChatInput 
                        input={input} 
                        setInput={setInput} 
                        handleSend={handleSend} 
                        isBotLoading={isBotLoading || isVoiceSessionActive} 
                        isAuthReady={isAuthReady} 
                    />
                    <VoiceControl 
                        isConnecting={isConnecting} 
                        isActive={isVoiceSessionActive} 
                        onToggle={handleToggleVoiceSession}
                    />
                </div>
                <ThinkingModeToggle 
                    isEnabled={isThinkingMode} 
                    setIsEnabled={setIsThinkingMode} 
                    isDisabled={isVoiceSessionActive || isConnecting}
                />
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 font-sans">
      <Header />
      <MessageList messages={messages} isBotLoading={isBotLoading && !isVoiceSessionActive} />
      <div className="p-4 bg-white bg-opacity-80 backdrop-blur-md shadow-inner_top">
        {renderCurrentStateUI()}
      </div>
    </div>
  );
};

export default App;