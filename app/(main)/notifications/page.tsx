'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, UserPlus, Star, Bell, MoreHorizontal } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type NotificationType = 'like' | 'comment' | 'follow' | 'mention';

interface Notification {
  id: number;
  type: NotificationType;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  read: boolean;
  postId?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'like',
      user: {
        name: 'Sarah Wilson',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop'
      },
      content: 'liked your post about blockchain technology',
      time: '5 minutes ago',
      read: false,
      postId: 123
    },
    {
      id: 2,
      type: 'comment',
      user: {
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop'
      },
      content: 'commented on your post: "Great insights! Would love to collaborate on this."',
      time: '2 hours ago',
      read: false,
      postId: 123
    },
    {
      id: 3,
      type: 'follow',
      user: {
        name: 'Emily Chen',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop'
      },
      content: 'started following you',
      time: '1 day ago',
      read: true
    },
    {
      id: 4,
      type: 'mention',
      user: {
        name: 'Michael Brown',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop'
      },
      content: 'mentioned you in a comment: "@johndoe what do you think about this approach?"',
      time: '2 days ago',
      read: true,
      postId: 456
    },
    {
      id: 5,
      type: 'like',
      user: {
        name: 'Jessica Lee',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop'
      },
      content: 'and 5 others liked your post about Web3 development',
      time: '3 days ago',
      read: true,
      postId: 789
    }
  ]);
  
  const [activeTab, setActiveTab] = useState('all');
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <Star className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };
  
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === activeTab);
  
  // Animation for notifications
  useEffect(() => {
    const notificationElements = document.querySelectorAll('.notification-card');
    notificationElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-slide-up');
      }, index * 100);
    });
  }, [activeTab]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={markAllAsRead}
          className="hover-scale"
        >
          Mark all as read
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full grid grid-cols-4 h-12">
          <TabsTrigger value="all" className="hover-scale">All</TabsTrigger>
          <TabsTrigger value="unread" className="hover-scale">Unread</TabsTrigger>
          {/* <TabsTrigger value="like" className="hover-scale">Likes</TabsTrigger>
          <TabsTrigger value="comment" className="hover-scale">Comments</TabsTrigger> */}
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-4 notification-card hover-scale transition-all ${!notification.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <img src={notification.user.avatar} alt={notification.user.name} />
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium">{notification.user.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{notification.content}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  
                  <div className="flex items-center">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!notification.read && (
                          <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                            Mark as read
                          </DropdownMenuItem>
                        )}
                        {notification.postId && (
                          <DropdownMenuItem>
                            View post
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          Turn off notifications from {notification.user.name}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No notifications to display</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}