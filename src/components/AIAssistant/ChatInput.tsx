import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Tag, Typography, message as antdMessage } from 'antd';
import { SendOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import { streamChat } from '@/api/dify';
import MessageBubble, { Message } from './MessageBubble';

const { Title, Text } = Typography;

const SUGGESTIONS = [
  '分析当前在线车辆的 SOC 状态',
  '汇总今日发生的电池警报和故障数',
  '生成一份关于驾驶员安全行为的简要分析',
];

const ChatInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load conversation on mount
  useEffect(() => {
    const savedMsgs = sessionStorage.getItem('dify_messages');
    const savedConvId = sessionStorage.getItem('dify_conv_id');
    if (savedMsgs) {
      try {
        setMessages(JSON.parse(savedMsgs));
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
    if (savedConvId) {
      setConvId(savedConvId);
    }
  }, []);

  // Save conversation helper
  const saveToSession = (msgs: Message[], id: string | null) => {
    sessionStorage.setItem('dify_messages', JSON.stringify(msgs));
    if (id) {
      sessionStorage.setItem('dify_conv_id', id);
    } else {
      sessionStorage.removeItem('dify_conv_id');
    }
  };

  // Auto scroll to bottom when messages list changes
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    if (loading) return;

    setLoading(true);
    setQuery('');

    // 1. Create and add user message
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = { id: userMsgId, role: 'user', content: trimmed };
    
    // 2. Create placeholder for assistant message
    const assistantMsgId = `ai-${Date.now()}`;
    const assistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: 'AI 思考中...' };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);

    // Set up abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let fullAnswer = '';
    let latestConvId = convId;

    try {
      const generator = streamChat(trimmed, latestConvId, abortControllerRef.current.signal);

      for await (const chunk of generator) {
        if (chunk.event === 'message') {
          fullAnswer += chunk.answer || '';
          // Update message content in state
          setMessages((prevMsgs) =>
            prevMsgs.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullAnswer } : m
            )
          );
        } else if (chunk.event === 'message_end' || chunk.conversationId) {
          if (chunk.conversationId) {
            latestConvId = chunk.conversationId;
            setConvId(latestConvId);
          }
        } else if (chunk.event === 'error') {
          throw new Error(chunk.error || '连接异常');
        }
      }

      // Finalize messages state and sync with session storage
      const finalAssistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: fullAnswer || '（未收到回复内容）' };
      const finalizedMessages = [...messages, userMsg, finalAssistantMsg];
      setMessages(finalizedMessages);
      saveToSession(finalizedMessages, latestConvId);

    } catch (err: any) {
      console.error('Chat stream failed:', err);
      // Update assistant message to show error
      const errorMsgContent = `AI 助手暂时不可用: ${err.message || '请求被中断或网络错误'}`;
      setMessages((prevMsgs) =>
        prevMsgs.map((m) =>
          m.id === assistantMsgId ? { ...m, content: errorMsgContent, isError: true } : m
        )
      );

      // Re-fetch current state to sync to session storage
      const finalizedMsgsWithError = [
        ...messages,
        userMsg,
        { id: assistantMsgId, role: 'assistant', content: errorMsgContent, isError: true } as Message,
      ];
      saveToSession(finalizedMsgsWithError, latestConvId);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setConvId(null);
    setQuery('');
    setLoading(false);
    sessionStorage.removeItem('dify_messages');
    sessionStorage.removeItem('dify_conv_id');
    antdMessage.success('对话历史已清空');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(query);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        marginBottom: 24,
        background: 'linear-gradient(135deg, #fbfcfd 0%, #f5f7fa 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #eef2f5',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space align="center" size={8}>
          <RobotOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            AI 智能助手 (Dify)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            随时解答关于智利车队状态、警报与驾驶分析的问题
          </Text>
        </Space>
        {messages.length > 0 && (
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleClear}
            style={{ fontSize: 13 }}
          >
            清空历史
          </Button>
        )}
      </div>

      {/* Message List area */}
      {messages.length > 0 && (
        <div
          ref={chatScrollRef}
          style={{
            maxHeight: 380,
            overflowY: 'auto',
            marginBottom: 20,
            padding: '16px 20px',
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #eef2f5',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {loading && messages[messages.length - 1]?.content === 'AI 思考中...' && (
            <div style={{ fontSize: 13, color: '#999', paddingLeft: 44, marginBottom: 12 }}>
              助手正在生成回复...
            </div>
          )}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Input.TextArea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问 AI 助手关于您的车队情况（例如：'智利物流集团有多少辆车？'，Enter 发送，Shift+Enter 换行）..."
          autoSize={{ minRows: 1.5, maxRows: 4 }}
          disabled={loading}
          style={{
            borderRadius: 8,
            fontSize: 14.5,
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
            padding: '10px 14px',
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSend(query)}
          loading={loading}
          disabled={!query.trim()}
          style={{
            height: 'auto',
            padding: '0 20px',
            borderRadius: 8,
            boxShadow: '0 2px 6px rgba(22, 119, 255, 0.2)',
          }}
        >
          发送
        </Button>
      </div>

      {/* Suggestion tags */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          推荐提问：
        </Text>
        {SUGGESTIONS.map((tag) => (
          <Tag
            key={tag}
            onClick={() => !loading && handleSend(tag)}
            style={{
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 4,
              padding: '2px 8px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e8e8e8',
              fontSize: 13,
              color: '#555',
              transition: 'all 0.2s',
            }}
            className="suggestion-tag"
          >
            {tag}
          </Tag>
        ))}
      </div>
    </Card>
  );
};

export default ChatInput;
