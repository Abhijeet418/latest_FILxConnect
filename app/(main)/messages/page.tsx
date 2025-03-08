'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search, Send, Image, Smile, Paperclip, MoreVertical, Phone, Video, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/app/apiconnector/api';
import { toast } from 'sonner';
// import { getFullImageUrl } from '@/lib/utils';

interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  time: string;
  read: boolean;
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Add the Cloudinary URL constant
  const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/";
  const DEFAULT_AVATAR = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/zybt9ffewrjwhq7tyvy1.png";
  // Add function to get full image URL
  const getFullImageUrl = (profilePicture: string | null | undefined): string => {
    if (!profilePicture) return DEFAULT_AVATAR;
    if (profilePicture.startsWith('http')) return profilePicture;
    return CLOUDINARY_BASE_URL + profilePicture;
  };

  const fetchConnections = async () => {
    try {
      const userId = localStorage.getItem('userId') || "404";
      const connections = await apiRequest(`followers/${userId}/followed`, 'GET') || [];
      
      // Map connections to Contact interface
      const contactsList = await Promise.all(connections.map(async (connection: any) => {
        const userDetails = await apiRequest(`users/${connection.id}`, 'GET');
        return {
          id: userDetails.id,
          name: userDetails.username,
          avatar: getFullImageUrl(userDetails.profilePicture),
          lastMessage: "No messages yet",
          time: "Now",
          unread: 0,
          online: userDetails.status === 1
        };
      }));

      setContacts(contactsList);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load contacts');
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectContact = (contact: Contact) => {
    setActiveContact(contact);
    
    // Mark messages as read
    if (contact.unread > 0) {
      setContacts(contacts.map(c => 
        c.id === contact.id ? { ...c, unread: 0 } : c
      ));
    }
    
    // Load conversation
    const conversation: Message[] = [
      // {
      //   id: 1,
      //   senderId: contact.id,
      //   text: 'Hi there! How are you doing today?',
      //   time: '10:30 AM',
      //   read: true
      // },
      // {
      //   id: 2,
      //   senderId: 0, // Current user
      //   text: "Hey! I'm doing well, thanks for asking. How about you?",
      //   time: '10:32 AM',
      //   read: true
      // },
      // {
      //   id: 3,
      //   senderId: contact.id,
      //   text: "I'm great! Just working on that blockchain project we discussed.",
      //   time: '10:34 AM',
      //   read: true
      // },
      // {
      //   id: 4,
      //   senderId: 0,
      //   text: "That sounds interesting! How's it coming along?",
      //   time: '10:36 AM',
      //   read: true
      // },
      // {
      //   id: 5,
      //   senderId: contact.id,
      //   text: contact.lastMessage,
      //   time: '10:40 AM',
      //   read: false
      // }
    ];
    
    setMessages(conversation);
  };
  
  const sendMessage = () => {
    if (!newMessage.trim() || !activeContact) return;
    
    const newMsg: Message = {
      id: Date.now(),
      senderId: 0, // Current user
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate reply after 2 seconds
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        senderId: activeContact.id,
        text: 'Thanks for the update! Let me check and get back to you.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Animation for contacts
  useEffect(() => {
    const contactElements = document.querySelectorAll('.contact-item');
    contactElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-slide-up');
      }, index * 100);
    });
  }, [searchQuery]);

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4 animate-fade-in bg-slate-50/30 dark:bg-slate-950/30">
      {/* Contacts sidebar - enhanced shadow and border */}
      <div className="w-full md:w-80 flex flex-col bg-background/95 shadow-xl rounded-2xl border border-blue-100/20 dark:border-blue-900/20 backdrop-blur-sm overflow-hidden">
        {/* Search section */}
        <div className="p-4 bg-blue-50/80 dark:bg-blue-950/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search messages" 
              className="pl-10 hover-scale bg-background/90 border-blue-100 dark:border-blue-900/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 px-2">
          {/* Updated contact items styling */}
          {filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              className={`p-3 rounded-xl mb-2 cursor-pointer transition-all contact-item hover-scale border ${
                activeContact?.id === contact.id 
                  ? 'bg-blue-100/80 dark:bg-blue-900/60 border-blue-200 dark:border-blue-800' 
                  : 'hover:bg-blue-50/80 dark:hover:bg-blue-950/60 border-transparent'
              }`}
              onClick={() => selectContact(contact)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <img src={contact.avatar} alt={contact.name} />
                  </Avatar>
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    <span className="text-xs text-muted-foreground">{contact.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
                
                {contact.unread > 0 && (
                  <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center">
                    {contact.unread}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      
      {/* Chat area - enhanced shadow and border */}
      {activeContact ? (
        <div className="hidden md:flex flex-col flex-1 bg-background/95 rounded-2xl shadow-xl border border-blue-100/20 dark:border-blue-900/20 backdrop-blur-sm overflow-hidden">
          {/* Chat header */}
          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/50 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <img src={activeContact.avatar} alt={activeContact.name} />
              </Avatar>
              <div>
                <h3 className="font-medium">{activeContact.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {activeContact.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* <Button variant="ghost" size="icon" className="hover-scale">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover-scale">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover-scale">
                <MoreVertical className="h-5 w-5" />
              </Button> */}
            </div>
          </div>
          
          {/* Messages area - add subtle gradient background */}
          <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-blue-50/20 dark:to-blue-950/20">
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === 0;
                
                return (
                  <div 
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[70%] animate-slide-up">
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <img src={activeContact.avatar} alt={activeContact.name} />
                        </Avatar>
                      )}
                      
                      <div 
                        className={`p-3 rounded-xl shadow-sm ${
                          isCurrentUser 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-blue-50 dark:bg-blue-900/40'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-xs opacity-70">{message.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Message input area */}
          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/50 shadow-sm">
            <div className="flex gap-2 bg-background/90 p-2 rounded-xl border border-blue-100/30 dark:border-blue-900/30">
              {/* <Button variant="ghost" size="icon" className="hover-scale">
                <Paperclip className="h-5 w-5" />
              </Button> */}
              {/* <Button variant="ghost" size="icon" className="hover-scale">
                <Image className="h-5 w-5" />
              </Button> */}
              <Button variant="ghost" size="icon" className="hover-scale">
                <Smile className="h-5 w-5" />
              </Button>
              
              <Input 
                placeholder="Type a message..." 
                className="flex-1 hover-scale"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
              />
              
              <Button 
                className="hover-scale"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-col flex-1 items-center justify-center text-center p-8 bg-background/95 rounded-2xl shadow-xl border border-blue-100/20 dark:border-blue-900/20 backdrop-blur-sm">
          <div className="bg-primary/10 p-4 rounded-full mb-4 animate-pulse-slow">
            <MessageCircle className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Select a conversation from the list to start chatting
          </p>
          <Button className="hover-scale">Start a new conversation</Button>
        </div>
      )}
      
      {/* Mobile view updates */}
      <div className="md:hidden flex-1 bg-background/95">
        {activeContact ? (
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="p-4 border-b flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveContact(null)}
                className="hover-scale"
              >
                Back
              </Button>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <img src={activeContact.avatar} alt={activeContact.name} />
                </Avatar>
                <h3 className="font-medium">{activeContact.name}</h3>
              </div>
              
              <Button variant="ghost" size="icon" className="hover-scale">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === 0;
                  
                  return (
                    <div 
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[80%] animate-slide-up">
                        {!isCurrentUser && (
                          <Avatar className="h-6 w-6">
                            <img src={activeContact.avatar} alt={activeContact.name} />
                          </Avatar>
                        )}
                        
                        <div 
                          className={`p-3 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <div className="flex justify-end items-center gap-1 mt-1">
                            <span className="text-xs opacity-70">{message.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="hover-scale">
                  <Smile className="h-5 w-5" />
                </Button>
                
                <Input 
                  placeholder="Type a message..." 
                  className="flex-1 hover-scale"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                />
                
                <Button 
                  className="hover-scale"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className="p-2 rounded-lg mb-2 cursor-pointer transition-all contact-item hover-scale hover:bg-muted"
                  onClick={() => selectContact(contact)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <img src={contact.avatar} alt={contact.name} />
                      </Avatar>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{contact.name}</h3>
                        <span className="text-xs text-muted-foreground">{contact.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                    </div>
                    
                    {contact.unread > 0 && (
                      <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center">
                        {contact.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
