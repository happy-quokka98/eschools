"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useColor } from './ColorContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoSend, IoPersonCircleOutline, IoSearchOutline } from 'react-icons/io5';

const SendIcon = IoSend as React.ComponentType<any>;
const PersonIcon = IoPersonCircleOutline as React.ComponentType<any>;
const SearchIcon = IoSearchOutline as React.ComponentType<any>;

interface ChatModuleProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

interface Message {
  _id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  receiver_id: string;
  receiver_name: string;
  receiver_role: string;
  content: string;
  date: string;
  time: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
}

const ChatModule: React.FC<ChatModuleProps> = ({ currentUser }) => {
  const { selectedColor } = useColor();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all messages involving the current user for contacts list compilation
  const { data: allMessages } = useQuery<Message[]>({
    queryKey: ['all-messages', currentUser.id, currentUser.role],
    queryFn: async () => {
      const response = await fetch(`/api/messages?user_id=${currentUser.id}&role=${currentUser.role}`);
      if (!response.ok) throw new Error();
      return response.json();
    },
    refetchInterval: 4000 // Poll for new messages every 4 seconds
  });

  // 2. Fetch available contacts list
  const { data: availableContacts } = useQuery<Contact[]>({
    queryKey: ['available-contacts', currentUser.id, currentUser.role],
    queryFn: async () => {
      const response = await fetch(`/api/messages?user_id=${currentUser.id}&get_contacts=true&role=${currentUser.role}`);
      if (!response.ok) throw new Error();
      return response.json();
    }
  });

  // 3. Fetch conversation thread with selected contact
  const { data: activeThread } = useQuery<Message[]>({
    queryKey: ['active-thread', currentUser.id, currentUser.role, selectedContact?.id],
    queryFn: async () => {
      const response = await fetch(`/api/messages?user_id=${currentUser.id}&contact_id=${selectedContact?.id}&role=${currentUser.role}`);
      if (!response.ok) throw new Error();
      return response.json();
    },
    enabled: !!selectedContact?.id,
    refetchInterval: 2500 // Poll active conversation faster (every 2.5s)
  });

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (msgData: Partial<Message>) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData),
      });
      if (!response.ok) throw new Error();
      return response.json();
    },
    onSuccess: (newData) => {
      queryClient.setQueryData<Message[]>(
        ['active-thread', currentUser.id, selectedContact?.id],
        (old) => [...(old || []), newData.data]
      );
      queryClient.invalidateQueries({ queryKey: ['all-messages', currentUser.id] });
      setTypedMessage('');
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedContact) return;

    sendMutation.mutate({
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_role: currentUser.role,
      receiver_id: selectedContact.id,
      receiver_name: selectedContact.name,
      receiver_role: selectedContact.role,
      content: typedMessage
    });
  };

  // Compile active chats list on the left side
  const activeChatsList = React.useMemo(() => {
    if (!allMessages) return [];
    
    const uniquePartners: Record<string, { lastMsg: Message; partner: Contact }> = {};

    allMessages.forEach(msg => {
      const isSender = msg.sender_id === currentUser.id;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;
      const partnerName = isSender ? msg.receiver_name : msg.sender_name;
      const partnerRole = isSender ? msg.receiver_role : msg.sender_role;

      if (!uniquePartners[partnerId]) {
        uniquePartners[partnerId] = {
          lastMsg: msg,
          partner: { id: partnerId, name: partnerName, role: partnerRole }
        };
      }
    });

    return Object.values(uniquePartners).sort((a, b) => {
      const dateC = b.lastMsg.date.localeCompare(a.lastMsg.date);
      if (dateC !== 0) return dateC;
      return b.lastMsg.time.localeCompare(a.lastMsg.time);
    });
  }, [allMessages, currentUser.id]);

  // Filter available contacts based on search query
  const filteredContacts = React.useMemo(() => {
    if (!availableContacts) return [];
    return availableContacts.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery)
    );
  }, [availableContacts, searchQuery]);

  return (
    <div style={{
      maxWidth: '1200px',
      width: '100%',
      height: '650px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Sidebar - Chats List */}
      <div style={{
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>შეტყობინებები</h3>
            <button
              onClick={() => setIsNewChatOpen(!isNewChatOpen)}
              style={{
                backgroundColor: isNewChatOpen ? '#64748b' : selectedColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isNewChatOpen ? 'დახურვა' : 'ახალი ჩატი'}
            </button>
          </div>

          {/* New Chat Search Dropdown */}
          {isNewChatOpen && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <SearchIcon size={16} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="მოძებნეთ სახელით..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                position: 'absolute',
                top: '40px',
                left: 0,
                right: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {filteredContacts.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>მომხმარებელი ვერ მოიძებნა</div>
                ) : (
                  filteredContacts.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedContact(c);
                        setIsNewChatOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {c.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {activeChatsList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
              ჩატის ისტორია ცარიელია
            </div>
          ) : (
            activeChatsList.map(item => {
              const isSelected = selectedContact?.id === item.partner.id;
              const lastMsgIsOutgoing = item.lastMsg.sender_id === currentUser.id;

              return (
                <div
                  key={item.partner.id}
                  onClick={() => setSelectedContact(item.partner)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? `${selectedColor}15` : 'transparent',
                    border: isSelected ? `1px solid ${selectedColor}33` : '1px solid transparent',
                    transition: 'all 0.2s',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ color: isSelected ? selectedColor : '#64748b', display: 'flex', alignItems: 'center' }}>
                    <PersonIcon size={34} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? selectedColor : '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.partner.name}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px'
                    }}>
                      {lastMsgIsOutgoing ? 'მე: ' : ''}{item.lastMsg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel - Messaging Window */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
        {selectedContact ? (
          <>
            {/* Header displaying contact name */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <PersonIcon size={34} style={{ color: selectedColor }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{selectedContact.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedContact.role === 'teacher' ? 'მასწავლებელი' : selectedContact.role === 'admin' ? 'ადმინისტრატორი' : 'მოსწავლე'}</div>
              </div>
            </div>

            {/* Conversation Feed */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {activeThread && activeThread.map(msg => {
                const isMine = msg.sender_id === currentUser.id;

                return (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        padding: '10px 16px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isMine ? selectedColor : 'white',
                        color: isMine ? 'white' : '#1f2937',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        border: isMine ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                        {msg.time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={typedMessage}
                onChange={e => setTypedMessage(e.target.value)}
                placeholder="ჩაწერეთ შეტყობინება..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!typedMessage.trim() || sendMutation.isPending}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: selectedColor,
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${selectedColor}44`,
                  transition: 'opacity 0.2s',
                  opacity: !typedMessage.trim() ? 0.6 : 1
                }}
              >
                <SendIcon size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#64748b',
            background: '#f8fafc',
            gap: '16px',
            padding: '40px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: `${selectedColor}12`,
              color: selectedColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
            }}>
              <PersonIcon size={44} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#334155' }}>შეტყობინებები</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '300px', textAlign: 'center', lineHeight: '1.5' }}>
              აირჩიეთ მომხმარებელი მარცხენა სიიდან საუბრის დასაწყებად.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatModule;
