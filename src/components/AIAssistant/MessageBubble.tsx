import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
      }}
    >
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? '#1677ff' : '#059669',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      />
      <div
        style={{
          maxWidth: '85%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: '#888',
            marginBottom: 4,
          }}
        >
          {isUser ? '我' : 'AI 智能助手'}
        </div>
        <div
          style={{
            backgroundColor: isUser ? '#e6f4ff' : '#ffffff',
            color: message.isError ? '#ff4d4f' : '#1f1f1f',
            padding: '12px 16px',
            borderRadius: isUser ? '12px 0 12px 12px' : '0 12px 12px 12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
            border: isUser ? '1px solid #bae0ff' : '1px solid #f0f0f0',
            fontSize: 14.5,
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
