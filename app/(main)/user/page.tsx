'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Camera, Edit, Heart, MessageCircle, Repeat, Share, Link as LinkIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from '@/lib/Firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { apiRequest } from '@/app/apiconnector/api';
import { Badge } from '@/components/ui/badge';

const DEFAULT_AVATAR = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/zybt9ffewrjwhq7tyvy1.png";
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/";

interface Reaction {
  id: string;
  user: {
    id: string; // Add this
    username: string;
    avatar: string;
  };
  emoji: string;
  createdAt: string;
}

interface Comment {
  id: string;
  user: {
    id: string; // Add this
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
}

interface Media {
  id: string;
  mediaUrl: string;
  mediaType: string;
  postId: string;
}

// Update the Post interface to include the proper media type
interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string; // Make updatedAt optional since it might not always be present
  time: string;
  reactions: number;
  likedBy: Reaction[];
  comments: number;
  commentsList: Comment[];
  mediaUrls: Media[]; // Change this to store the full media objects
}

// First, fix the timeAgo function to handle the specific date format
function timeAgo(dateString: string) {
  try {
    if (!dateString) {
      return 'Just now';
    }

    // Handle the API date format: "2025-03-05T19:23:23"
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Just now';
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates
    if (seconds < 0) {
      return 'Just now';
    }

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }

    return 'Just now';
  } catch (error) {
    console.error('Error parsing date:', error, 'for dateString:', dateString);
    return 'Just now';
  }
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState({
    name: '',
    profilePicture: DEFAULT_AVATAR,
    bio: '',
    userId: '',
    stats: {
      posts: 0,
      followers: 0,
      following: 0,
      reports: 0
    }
  });

  const [posts, setPosts] = useState<Post[]>([]);

  const [activeLikesPost, setActiveLikesPost] = useState<string | null>(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const fetchUserPosts = async () => {
    try {
      let viewUserId = localStorage.getItem('viewUserId') || "404";
      const rawPosts = await apiRequest(`posts/user/${viewUserId}`) || [];
      
      // Filter posts with status "1" before processing
      const activePosts = rawPosts.filter((post: any) => post.status === "1");
      console.log(activePosts, 'activePosts');
  
      // Then update the post object creation in fetchUserPosts
      const enrichedPosts: Post[] = await Promise.all(activePosts.map(async (post: any) => {
        try {
          // Fetch reactions list first
          // Get reactions with user details
                  const reactions = await apiRequest(`reactions/posts/${post.id}`, 'GET') || [];
                  const enrichedReactions = await Promise.all(reactions.map(async (r: any) => {
                    const userDetails = await apiRequest(`users/${r.userId}`, 'GET');
                    return {
                      id: r.id,
                      user: {
                        username: userDetails.status === 0 ? 'Blocked User' : userDetails.username,
                        avatar: userDetails.status === 0 ? DEFAULT_AVATAR : getFullImageUrl(userDetails.profilePicture)
                      },
                      emoji: '👍',
                      createdAt: r.createdAt
                    };
                  }));
          
                  // Get comments with user details
                  const comments = await apiRequest(`comments/${post.id}`, 'GET') || [];
                  const enrichedComments = await Promise.all((comments || []).map(async (comment: any) => {
                    return {
                      id: comment.id,
                      user: {
                        id: comment.user.id,
                        username: comment.user.username,
                        avatar: getFullImageUrl(comment.user.profilePicture)
                      },
                      content: comment.content,
                      createdAt: timeAgo(comment.createdAt)
                    };
                  }));

          // Add media fetch
          const mediaResponse = await apiRequest(`media/${post.id}`, 'GET') || [];
          const mediaList: Media[] = Array.isArray(mediaResponse) ? mediaResponse : [];
  
          // Return formatted post object
          return {
            id: post.id,
            author: {
              id: post.user.id,
              username: userProfile.name,
              profilePicture: getFullImageUrl(userProfile.profilePicture)
            },
            content: post.content,
            createdAt: timeAgo(post.createdAt),
            reactions: enrichedReactions.length,
            likedBy: enrichedReactions,
            comments: enrichedComments.length,
            commentsList: enrichedComments,
            mediaUrls: (mediaList || []).map((m: any) => ({
              id: m.id,
              mediaUrl: getFullImageUrl(m.mediaUrl),
              mediaType: m.mediaType || 'image',
              postId: m.postId
            }))
          };
  
        } catch (error) {
          console.error(`Error fetching additional data for post ${post.id}:`, error);
          return {
            id: post.id,
            content: post.content,
            createdAt: post.createdAt,
            time: timeAgo(post.createdAt), // Use timeAgo here as well
            reactions: 0,
            comments: 0,
            commentsList: [],
            likedBy: []
          };
        }
      }));
      
      // // Sort posts by createdAt in descending order
      // const sortedPosts = enrichedPosts.sort((a, b) => {
      //   // Find original posts to get createdAt values
      //   const postA = activePosts.find(p => p.id === a.id);
      //   const postB = activePosts.find(p => p.id === b.id);
        
      //   // Convert dates to timestamps for comparison
      //   const timeA = new Date(postA?.createdAt || 0).getTime();
      //   const timeB = new Date(postB?.createdAt || 0).getTime();
        
      //   // Sort in descending order (newest first)
      //   return timeB - timeA;
      // });
      
      setPosts(enrichedPosts);
  
    } catch (error) {
      console.error('Error fetching user posts:', error);
      toast.error('Failed to fetch user posts');
      setPosts([]);
    }
  };

  const fetchPostCount = async () => {
    try {
      let viewUserId = localStorage.getItem('viewUserId') || "404";
      const rawPosts = await apiRequest(`posts/user/${viewUserId}`) || [];
      const activePosts = rawPosts.filter((post: any) => post.status === "1");
      const reportCountRes = await apiRequest(`users/${viewUserId}`) || null;
    
      setUserProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          posts: Number(activePosts.length),
          reports: Number(reportCountRes.reports)
        }
      }));
    } catch (error) {
      console.error('Error fetching post counts:', error);
      toast.error('Failed to fetch post counts');
    }
  };

  const fetchFollowerCounts = async () => {
    try {
      let viewUserId = localStorage.getItem('viewUserId') || "404";
      // Fetch followers count
      const followersResponse = await apiRequest(`followers/${viewUserId}/followers/count`, 'GET');
      const followersCount = followersResponse || 0;  // Extract the count from response

      // Fetch following count
      const followingResponse = await apiRequest(`followers/${viewUserId}/following/count`, 'GET');
      const followingCount = followingResponse || 0;  // Extract the count from response

      setUserProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers: Number(followersCount),
          following: Number(followingCount)
        }
      }));
    } catch (error) {
      console.error('Error fetching follower counts:', error);
      toast.error('Failed to fetch follower counts');

      // Set defaults in case of error
      setUserProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers: 0,
          following: 0
        }
      }));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let viewUserId = localStorage.getItem('viewUserId') || "404";
        let userResponse = await apiRequest(`users/${viewUserId}`,'GET');
        
        // Construct the full profile picture URL
        const profilePicture = userResponse.profilePicture ? 
                             CLOUDINARY_BASE_URL + userResponse.profilePicture : 
                             DEFAULT_AVATAR;

        setUserProfile(prev => ({
          ...prev,
          name: userResponse.username || 'User',
          profilePicture: profilePicture,
          bio: userResponse.bio,
          userId: userResponse.id
        }));

        fetchFollowerCounts();
        fetchPostCount();
        fetchUserPosts();
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user profile');
      }
    };

    fetchUserData();
  }, []);

  const handleLikeClick = async (postId: string) => {
    try {
      let userId = localStorage.getItem('userId') || "404";
      
      // Check if user already liked the post
      const currentPost = posts.find(p => p.id === postId.toString());
      const hasLiked = currentPost?.likedBy.some(like => like.user.username === userProfile.name);
  
      if (hasLiked) {
        // Unlike the post
        const unlikeResponse = await apiRequest(`reactions/${postId}/${userId}`, 'DELETE');
        
        if (unlikeResponse !== undefined) {
          // Update state to remove the like
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if (post.id === postId.toString()) {
                return {
                  ...post,
                  reactions: post.reactions - 1,
                  likedBy: post.likedBy.filter(like => like.user.username !== userProfile.name)
                };
              }
              return post;
            })
          );
          toast.error("Unliked this post!");
        }
        return;
      }
  
      // Add the like
      const likeResponse = await apiRequest(`reactions/${postId}/${userId}/👍`, 'POST');
      
      if (likeResponse) {
        // Update state to add the like
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              const newLike = {
                id: Date.now().toString(),
                user: {
                  id: userProfile.userId, // Add this
                  username: userProfile.name,
                  avatar: userProfile.profilePicture
                },
                emoji: '👍',
                createdAt: new Date().toLocaleString()
              };
              
              return {
                ...post,
                reactions: post.reactions + 1,
                likedBy: [...post.likedBy, newLike]
              };
            }
            return post;
          })
        );
        toast.success("Post liked!");
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      toast.error("Failed to update like");
    }
  };

  const handleCommentClick = async (postId: string) => {
    setActiveCommentsPost(postId);
  };

  const handleCommentSubmit = async (postId: string) => {
    try {
      if (!newComment.trim()) {
        toast.error('Please enter a comment');
        return;
      }
  
      const userId = localStorage.getItem('userId') || "404";
      const response = await apiRequest(`comments?postId=${postId}&userId=${userId}&content=${newComment}`, 'POST');
      console.log(response);
  
      if (response) {
        // Add new comment to the state
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              const newCommentObj = {
                id: Date.now().toString(),
                user: {
                  id: userProfile.userId, // Add this
                  username: userProfile.name,
                  avatar: getFullImageUrl(userProfile.profilePicture) // Use the helper function
                },
                content: newComment,
                createdAt: new Date().toISOString() // Use ISO string for consistency
              };
              return {
                ...post,
                comments: post.comments + 1,
                commentsList: [...post.commentsList, newCommentObj]
              };
            }
            return post;
          })
        );
  
        setNewComment(''); // Clear input
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const shareUrl = `${window.location.origin}/post/${postId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: 'Check out this interesting post!',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share post');
    }
  };

  const navigateToUserProfile = (userId: string) => {
    localStorage.setItem('viewUserId', userId);
    window.location.href = '/user';
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className="px-4 pt-8 pb-4 bg-gradient-to-b from-primary/5 to-background rounded-b-3xl">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {/* Profile Photo */}
          <div className="relative mb-6 md:mb-0">
            <Avatar className="w-40 h-40 border-4 border-background shadow-xl">
              <img
                src={userProfile.profilePicture}
                alt={userProfile.name}
                className="object-cover"
              />
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold mb-2">{userProfile.name}</h1>
                <p className="text-muted-foreground">{userProfile.bio}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 justify-center md:justify-start mt-6">
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold">{userProfile.stats.posts}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold">{userProfile.stats.followers}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold">{userProfile.stats.following}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
              <div className="text-center md:text-left">
                <div className={`text-2xl font-bold ${
                  userProfile.stats.reports === 0 
                    ? 'text-green-500' 
                    : userProfile.stats.reports === 1 
                      ? 'text-orange-500' 
                      : 'text-destructive'
                }`}>
                  {userProfile.stats.reports}
                </div>
                <div className="text-sm text-muted-foreground">Reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="px-4 mt-6">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4 mb-4 shadow-md post-card hover-scale transition-all">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  <img src={userProfile.profilePicture} alt={userProfile.name} />
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{userProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{post.createdAt}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="mb-4">{post.content}</p>

              {/* Media Content */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="mb-4">
                  <div className={`grid ${
                    post.mediaUrls.length === 1 ? 'grid-cols-1' : 
                    post.mediaUrls.length === 2 ? 'grid-cols-2' :
                    post.mediaUrls.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  } gap-2`}>
                    {post.mediaUrls.map((media, index) => (
                      <div 
                        key={media.id}
                        className={`${
                          post.mediaUrls.length === 3 && index === 0 ? 'col-span-2' : ''
                        }`}
                      >
                        <img
                          src={media.mediaUrl}
                          alt={`Post media ${index + 1}`}
                          className="rounded-lg w-full object-cover h-[250px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              <div className="flex gap-2 mb-4">
                {post.content.split(' ')
                  .filter(word => word.startsWith('#'))
                  .map((tag, index) => (
                    <Badge key={index} variant="secondary" className="hover-scale">
                      {tag}
                    </Badge>
                  ))}
              </div>

              <Separator className="my-4" />

              {/* Interaction Buttons */}
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikeClick(post.id)}
                    className="hover:text-primary p-0 mr-1"
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        post.likedBy.some(like => like.user.username === userProfile.name)
                          ? 'fill-current text-primary'
                          : ''
                      }`} 
                    />
                  </Button>

                  <Dialog open={activeLikesPost === post.id} onOpenChange={(open) => setActiveLikesPost(open ? post.id : null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-primary p-0"
                      >
                        {post.reactions}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Liked by</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {post.likedBy.map((rct) => (
                            <div key={rct.id} className="flex items-center gap-3">
                              <Avatar 
                                className="h-10 w-10 cursor-pointer hover:opacity-80"
                                onClick={() => navigateToUserProfile(rct.user.id)}
                              >
                                <img 
                                  src={rct.user.avatar} 
                                  alt={rct.user.username}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = DEFAULT_AVATAR;
                                  }}
                                  className="h-full w-full object-cover"
                                />
                              </Avatar>
                              <div className="flex-1">
                                <p 
                                  className="font-medium cursor-pointer hover:opacity-80"
                                  onClick={() => navigateToUserProfile(rct.user.id)}
                                >
                                  {rct.user.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {timeAgo(rct.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center">
                  <Dialog 
                    open={activeCommentsPost === post.id} 
                    onOpenChange={(open) => setActiveCommentsPost(open ? post.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-primary p-0 flex items-center gap-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Comments</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {post.commentsList.map((comment) => (
                            <div key={comment.id} className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  className="h-8 w-8 cursor-pointer hover:opacity-80"
                                  onClick={() => navigateToUserProfile(comment.user.id)}
                                >
                                  <img src={comment.user.avatar} alt={comment.user.username} />
                                </Avatar>
                                <div className="flex-1">
                                  <p 
                                    className="font-medium cursor-pointer hover:opacity-80"
                                    onClick={() => navigateToUserProfile(comment.user.id)}
                                  >
                                    {comment.user.username}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{comment.createdAt}</p>
                                </div>
                              </div>
                              <p className="text-sm pl-11">{comment.content}</p>
                              <Separator className="mt-4" />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex items-center mt-4">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleCommentSubmit(post.id)}
                          className="ml-2"
                        >
                          Post
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:text-primary">
                      <Repeat className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Share Post</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                            toast.success('Link copied to clipboard!');
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        {typeof navigator.share === 'function' && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleShare(post.id)}
                          >
                            <Repeat className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Input 
                            readOnly 
                            value={`${window.location.origin}/post/${post.id}`}
                            className="h-9"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                            toast.success('Link copied!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add or update the getFullImageUrl helper function if not already present:
const getFullImageUrl = (profilePicture: string | null | undefined): string => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (profilePicture.startsWith('http')) return profilePicture;
  return CLOUDINARY_BASE_URL + profilePicture;
};