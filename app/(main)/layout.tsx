'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Share2, Home, Bell, MessageCircle, User, LogOut, Menu, Search, Check, UserPlus, PenSquare, Clock, CheckCircle, XCircle, List, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from '@/components/ui/sheet';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { ProgressTimer } from '@/components/ui/progress-timer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from '../apiconnector/api';
import { auth } from '@/lib/Firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { set } from 'zod';

interface SuggestedUser {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
  title: string;
}

interface Connection {
  id: number;
  username: string;
  profilePicture: string;
  status: 'online' | 'offline';
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestedUsers, setSuggestedUser] = useState<SuggestedUser[]>([]);
  // const [userId,setUserId] = useState("");

  useEffect(() => {

    let userId = localStorage.getItem('userId') || "404";
    const fetchSuggestedUser = async () => {
      const res = await apiRequest(`followers/${userId}/notfollowed`, "GET");

      setSuggestedUser(res);
    }

    fetchSuggestedUser();
  })

  const [myConnections, setMyConnections] = useState<Connection[]>([]);

  const [currentUser, setCurrentUser] = useState({
    username: '',
    email: '',
    photoURL: '',
  });

  const [sentRequests, setSentRequests] = useState<number[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number[]>([]);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [suggestionsSearchQuery, setSuggestionsSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    title: string;
  }>>([]);

  const navigation = [
    { name: 'Home', href: '/home', icon: Home, notifications: 0 },
    { name: 'Notifications', href: '/notifications', icon: Bell, notifications: 3 },
    { name: 'Messages', href: '/messages', icon: MessageCircle, notifications: 2 },
    { name: 'Profile', href: '/profile', icon: User, notifications: 0 },
    { name: 'Post', href: '#', icon: PenSquare, notifications: 0 },
  ];

  const allSuggestedUsers: SuggestedUser[] = suggestedUsers?.slice(0, 3);


  const router = useRouter();
  const { signOut } = useAuth();

  const handleNavClick = (href: string, name: string) => {
    if (name === 'Post') {
      setIsPostModalOpen(true);
    } else {
      router.push(href);
    }
  };

  const sentTheConnectionReq = async (followingId: string, followerId: string) => {

    const dataToBeSend = {
      followerId,
      followingId
    };

    try {
      const res = await apiRequest(`followers/follow?followerId=${followerId}&followingId=${followingId}`, "POST");
      console.log("Response: ", res);
    } catch (error) {
      console.log("Error: ", error);
    }
  };


  const fetchAllTheConnection = async () => {
    let userId = localStorage.getItem('userId') || "404";
    const res = await apiRequest(`followers/${userId}/followed`, "GET");
    console.log("HEllo ", res);
    setMyConnections(res);
  }
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Add Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      console.log(user, "is the user");
      if (user) {
        let userId = localStorage.getItem('userId') || "404";
        const User = await apiRequest(`users/${userId}`, 'GET') || {};
        setCurrentUser({
          username: User.username || 'Loading...',
          email: User.email || 'Loading...',
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
        });
      }
    });

    fetchAllTheConnection();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const showSidebars = !pathname?.includes('/landing');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {
        showSidebars && (
          <header className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
            : "bg-background"
            }`}>
            <div className="container flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-3 animate-fade-in pl-2">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="FILxCONNECT Logo"
                    width={45}
                    height={45}
                    className="object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-primary">FILxCONNECT</span>
              </div>

              {/* Replace the existing search input in the header */}
              <div className="hidden md:flex max-w-md flex-1 mx-8">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => setIsSearchDialogOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search connections...
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <ThemeToggle />

                <div className="md:hidden">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover-scale">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-4 p-4 border-b">
                          <Avatar className="h-10 w-10">
                            <img src={currentUser.photoURL} alt="User" />
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{currentUser.username}</h3>
                            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                          </div>
                        </div>

                        <nav className="flex-1 p-4 space-y-2">
                          {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="relative"
                                onClick={(e) => {
                                  if (item.name === 'Post') {
                                    e.preventDefault();
                                    setIsPostModalOpen(true);
                                  }
                                }}
                              >
                                <Button
                                  variant={isActive ? 'default' : 'ghost'}
                                  className="w-full justify-start hover-scale"
                                >
                                  <Icon className="mr-2 h-5 w-5" />
                                  {item.name}
                                  {item.notifications > 0 && (
                                    <Badge variant="destructive" className="ml-auto">
                                      {item.notifications}
                                    </Badge>
                                  )}
                                </Button>
                              </Link>
                            );
                          })}
                        </nav>

                        <div className="p-4 border-t">
                          <Button
                            variant="outline"
                            className="w-full justify-start hover-scale"
                            onClick={async () => {
                              await signOut();
                              localStorage.setItem("userId", "Invalid");
                              router.push('/login');
                            }}
                          >
                            <LogOut className="mr-2 h-5 w-5" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover-scale"
                    onClick={async () => {
                      await signOut();
                      router.push('/login');
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>
        )
      }

      {/* Sidebar Navigation */}
      {showSidebars && (
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 p-4 hidden md:block animate-fade-in">
          {/* Replace the existing sidebar user section */}
          <div className="flex items-center gap-3 mb-4 p-2">
            <Avatar className="h-10 w-10">
              <img src={currentUser.photoURL} alt={currentUser.username} />
            </Avatar>
            <div>
              <h3 className="font-medium">{currentUser.username}</h3>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>

          <nav className="space-y-1 mb-4">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.name === 'Post') {
                      e.preventDefault();
                      setIsPostModalOpen(true);
                    }
                  }}
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start hover-scale animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.name}
                    {item.notifications > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.notifications}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="mt-0">
            <h3 className="font-semibold mb-2 px-2">My Connections</h3>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {myConnections.map((connection) => (
                <Link
                  key={connection.id}
                  href={`/profile/${connection.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <img src={connection.profilePicture} alt={connection.username} />
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${connection.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                    />
                  </div>
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {connection.username}
                  </span>
                </Link>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsConnectionsModalOpen(true)}
            >
              View all connections
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background md:hidden z-10">
        <nav className="flex justify-around p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative"
                onClick={(e) => {
                  if (item.name === 'Post') {
                    e.preventDefault();
                    setIsPostModalOpen(true);
                  }
                }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover-scale ${isActive ? 'text-primary' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {item.notifications}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className={`pt-16 ${showSidebars ? 'md:pl-64 md:pr-80' : ''} min-h-screen pb-16 md:pb-0`}>
        {children}
      </main>

      {/* Add the People You May Know section */}
      {showSidebars && (
        <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 p-4 hidden md:block animate-fade-in">
          <h3 className="font-semibold mb-4 animate-slide-up">People you may know</h3>
          <div className="space-y-3">
            {allSuggestedUsers.map((user: any, index: number) => {
              const isRequestSent = sentRequests.includes(user.id);

              return (
                <Card
                  key={user.id}
                  className="p-4 hover-scale transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <Image
                        width={30}
                        height={30}
                        src={user.profilePicture || "https://github.com/shadcn.png"}
                        alt={user.username}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://github.com/shadcn.png";
                        }}
                      />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isRequestSent ? "ghost" : "ghost"}
                      className={`hover-scale ml-2 transition-all duration-300 ${isRequestSent ? "text-green-500" : ""
                        }`}
                      onClick={() => {
                        if (!isRequestSent && !pendingRequests.includes(user.id)) {
                          let userId = localStorage.getItem('userId') || "404";
                          sentTheConnectionReq(user.id, userId);
                          setPendingRequests(prev => [...prev, user.id]);
                          setTimeout(() => {
                            setPendingRequests(prev => prev.filter(id => id !== user.id));
                            setSentRequests(prev => [...prev, user.id]);
                          }, 3000);
                        }
                      }}
                      disabled={isRequestSent || pendingRequests.includes(user.id)}
                    >
                      <div className="relative w-5 h-5">
                        {pendingRequests.includes(user.id) ? (
                          <ProgressTimer
                            duration={3}
                            onComplete={() => {
                              setPendingRequests(prev => prev.filter(id => id !== user.id));
                              setSentRequests(prev => [...prev, user.id]);
                            }}
                          />
                        ) : (
                          <div className={`absolute inset-0 transition-all duration-300 transform ${isRequestSent ? "opacity-0 scale-0" : "opacity-100 scale-100"
                            }`}>
                            <UserPlus className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button
              variant="link"
              className="text-muted-foreground hover:text-primary"
              onClick={() => setIsSuggestionsModalOpen(true)}
            >
              View more suggestions →
            </Button>
          </p>
        </div>
      )}

      <Dialog open={isConnectionsModalOpen} onOpenChange={setIsConnectionsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              My Connections
            </DialogTitle>
          </DialogHeader>

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search connections..."
              className="w-full pl-10 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {myConnections
                .filter(connection =>
                  connection.username.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-all duration-200"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <img src={connection.profilePicture} alt={connection.username} />
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${connection.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                      />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium">{connection.username}</h4>
                      <p className="text-sm text-muted-foreground">
                        {connection.status === 'online' ? 'Active now' : 'Offline'}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuggestionsModalOpen} onOpenChange={setIsSuggestionsModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <DialogTitle className="text-2xl font-bold">
              Suggested Connections
            </DialogTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search people..."
                className="w-full pl-10 bg-muted/50"
                value={suggestionsSearchQuery}
                onChange={(e) => setSuggestionsSearchQuery(e.target.value)}
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto dialog-scroll pr-4 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedUsers
                .filter(user =>
                  user.username.toLowerCase().includes(suggestionsSearchQuery.toLowerCase()) ||
                  user.username.toLowerCase().includes(suggestionsSearchQuery.toLowerCase()) ||
                  user.title.toLowerCase().includes(suggestionsSearchQuery.toLowerCase())
                )
                .map((user) => {
                  const isRequestSent = sentRequests.includes(user.id);

                  return (
                    <Card
                      key={user.id}
                      className="p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <Image width={80} height={80} src={user.profilePicture} alt={user.username} className="object-cover" />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.username}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isRequestSent ? "ghost" : "default"}
                          className={`transition-all duration-300 ${isRequestSent ? "text-green-500" : ""
                            }`}
                          onClick={() => {
                            if (!isRequestSent) {
                              setSentRequests(prev => [...prev, user.id]);
                            }
                          }}
                          disabled={isRequestSent}
                        >
                          {isRequestSent ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          <span className="ml-2">{isRequestSent ? 'Request Sent' : 'Connect'}</span>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">My Posts</DialogTitle>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  All Posts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  {/* Pending posts will go here */}
                  <Card className="p-4">
                    <p className="text-muted-foreground">No pending posts</p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="approved" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  {/* Approved posts will go here */}
                  <Card className="p-4">
                    <p className="text-muted-foreground">No approved posts</p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="rejected" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  {/* Rejected posts will go here */}
                  <Card className="p-4">
                    <p className="text-muted-foreground">No rejected posts</p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="all" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  {/* All posts will go here */}
                  <Card className="p-4">
                    <p className="text-muted-foreground">No posts found</p>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogHeader>

          <div className="mt-auto pt-4 flex justify-end">
            <Button onClick={() => setIsPostModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">Search connections</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, username, or role..."
                className="w-full pl-10 bg-muted/50"
                onChange={(e) => {
                  // Here you would typically make an API call to search users
                  const query = e.target.value.toLowerCase();
                  const filtered = allSuggestedUsers.filter(user =>
                    user.username.toLowerCase().includes(query) ||
                    user.username.toLowerCase().includes(query) ||
                    user.title.toLowerCase().includes(query)
                  ).map(user => ({
                    ...user,
                    id: String(user.id)
                  }));
                  // setSearchResults(filtered);
                }}
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {searchResults.map((user) => (
                <Card key={user.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <img src={user.avatar} alt={user.username} className="object-cover" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-primary/10"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}