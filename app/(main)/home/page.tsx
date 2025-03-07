'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Image, Video, Smile, Send, MoreHorizontal, Flag, MessageCircle, Heart, Repeat, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiRequest } from '@/app/apiconnector/api';
import { title } from 'node:process';

const DEFAULT_URL = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/zybt9ffewrjwhq7tyvy1.png";

// First, add these interfaces at the top of your file
interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  image: string | null;
  time: string;
  likes: number;
  liked: boolean;
  comments: number;
  commentsList: Comment[];
  shares: number;
}

export default function HomePage() {

  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>(DEFAULT_URL);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Tridib Paul',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
      content: 'Excited to announce that our team has just completed a major milestone in our project! 🚀 #springboot #innovation',
      image: null,
      time: '2h ago',
      likes: 24,
      liked: false,
      comments: 5,
      commentsList: [
        {
          id: 1,
          author: 'Alice Johnson',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
          content: 'This is amazing! Keep up the great work! 🎉',
          time: '1h ago'
        },
        {
          id: 2,
          author: 'Bob Wilson',
          avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
          content: 'Interesting perspective on blockchain technology',
          time: '30m ago'
        }
      ],
      shares: 2
    },
    {
      id: 2,
      author: 'Jaspreet Singh',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
      content: 'Just deployed our website on vercel!. Check it out and let me know your thoughts! 📝 #web3 #development',
      image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=2070&auto=format&fit=crop',
      time: '4h ago',
      likes: 42,
      liked: false,
      comments: 8,
      commentsList: [],
      shares: 6
    },
    {
      id: 3,
      author: 'Joseph Paul',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
      content: 'Bitcoin price whenever I click the buy button... #funny',
      image: 'https://images.unsplash.com/photo-1591994843349-f415893b3a6b?q=80&w=2070&auto=format&fit=crop',
      time: '6h ago',
      likes: 67,
      liked: true,
      comments: 12,
      commentsList: [],
      shares: 9
    }
  ]);

  const [commentText, setCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '🚀'];

  useEffect(() => {
    const fetchProfilePicture = () => {
      const storedPicture = localStorage.getItem("profile_picture");
      setProfilePicture(storedPicture || DEFAULT_URL);
    };

    fetchProfilePicture();
    // Add event listener for storage changes
    window.addEventListener('storage', fetchProfilePicture);

    return () => {
      window.removeEventListener('storage', fetchProfilePicture);
    };
  }, []);

  const handlePostSubmit = async () => {
    if (!newPost.trim() && selectedFiles.length === 0) return;
    setIsSubmitting(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User ID not found in localStorage");
      setIsSubmitting(false);
      return;
    }

    let uploadedUrls: string[] = [];

    // Upload all files
    if (selectedFiles.length > 0) {
      try {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
          formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          const data = await response.json();
          if (!response.ok) {
            throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
          }
          return data.secure_url;
        });

        uploadedUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error('Failed to upload media');
        setIsSubmitting(false);
        return;
      }
    }

    const dataToBeSent = {
      userId: userId,
      title: "New Post",
      content: newPost,
      caption: "New Post",
      status: "1",
      mediaUrls: uploadedUrls
    };

    try {
      const res = await apiRequest('posts', 'POST', dataToBeSent);
      console.log("API Response:", res);
      setNewPost('');
      setSelectedFiles([]);
      setSelectedPreviews([]);
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error("Error creating post:", error.response?.data || error.message);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 4; // Maximum number of files allowed

    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files`);
      return;
    }

    // Create preview URLs and add new files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedPreviews(prev => [...prev, ...newPreviews]);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('Video must be less than 100MB');
        return;
      }
      setSelectedFiles(prev => [...prev, file]);
      setSelectedPreviews(prev => [...prev, URL.createObjectURL(file)]);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVideoClick = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
          liked: !post.liked
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: number) => {
    if (activeCommentId === postId) {
      setActiveCommentId(null);
    } else {
      setActiveCommentId(postId);
      setCommentText(''); // Clear comment text when switching posts
    }
  };

  const submitComment = (postId: number) => {
    if (!commentText.trim()) return;

    try {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const newComment: Comment = {
            id: Date.now(),
            author: 'You',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
            content: commentText.trim(),
            time: 'Just now'
          };

          return {
            ...post,
            comments: post.comments + 1,
            commentsList: [newComment, ...post.commentsList]
          };
        }
        return post;
      }));

      setCommentText('');
      // Optionally, you can add a success toast/notification here
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Optionally, you can add an error toast/notification here
    }
  };

  const addEmoji = (emoji: string) => {
    setNewPost(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Animation for new posts
  useEffect(() => {
    const postElements = document.querySelectorAll('.post-card');
    postElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-slide-up');
      }, index * 100);
    });
  }, []);

  const handleShare = async (postId: number) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post on FILxCONNECT',
          text: 'I found this interesting post on FILxCONNECT',
          url: shareUrl
        });

        // Update share count
        setPosts(prevPosts => prevPosts.map(post =>
          post.id === postId
            ? { ...post, shares: post.shares + 1 }
            : post
        ));

        toast.success('Post shared successfully!');
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      // Fallback to copy link
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');

        // Update share count
        setPosts(prevPosts => prevPosts.map(post =>
          post.id === postId
            ? { ...post, shares: post.shares + 1 }
            : post
        ));
      } catch (err) {
        toast.error('Failed to share post');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <Card className="p-4 mb-6 shadow-md hover-scale transition-all">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <img 
              src={profilePicture} 
              alt="Profile" 
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = DEFAULT_URL;
              }}
            />
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="mb-4 resize-none hover-scale focus:border-primary"
              rows={2}
            />

            {/* Media previews */}
            {selectedPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {selectedPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    {selectedFiles[index]?.type.startsWith('video/') ? (
                      <video
                        src={preview}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedPreviews(prev => prev.filter((_, i) => i !== index));
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* File input fields */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={videoInputRef}
              className="hidden"
              accept="video/*"
              onChange={handleVideoChange}
            />

            {/* Media upload buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="hover-scale"
                  disabled={selectedFiles.length >= 4}
                >
                  <Image className="w-4 h-4 mr-2 text-primary" />
                  Photo
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => videoInputRef.current?.click()} 
                  className="hover-scale"
                  disabled={selectedFiles.length >= 1}
                >
                  <Video className="w-4 h-4 mr-2 text-primary" />
                  Video
                </Button>
                <div className="relative inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="hover-scale"
                  >
                    <Smile className="w-4 h-4 mr-2 text-primary" />
                  </Button>
                  {/* ...emoji picker code... */}
                </div>
              </div>

              <Button
                size="sm"
                onClick={handlePostSubmit}
                disabled={isSubmitting || (!newPost.trim() && selectedFiles.length === 0)}
                className="hover-scale ml-auto"
              >
                {isSubmitting ? (
                  <span className="animate-spin mr-2">
                    {/* ...loading svg... */}
                  </span>
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {posts.map((post) => (
        <Card key={post.id} className="p-4 mb-4 shadow-md post-card hover-scale transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <img src={post.avatar} alt={post.author} />
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{post.author}</h3>
              <p className="text-sm text-muted-foreground">{post.time}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mb-4">{post.content}</p>

          {post.image && (
            <div className="mb-4">
              <img
                src={post.image}
                alt="Post"
                className="w-full rounded-lg object-cover max-h-96"
              />
            </div>
          )}

          <div className="flex gap-2 mb-4">
            {post.content.split(' ').filter(word => word.startsWith('#')).map((tag, index) => (
              <Badge key={index} variant="secondary" className="hover-scale">
                {tag}
              </Badge>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(post.id)}
              className={post.liked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${post.liked ? "fill-current text-red-500" : ""}`} />
              {post.likes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleComment(post.id)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {post.comments}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Repeat className="h-4 w-4 mr-2" />
                  {post.shares}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share this post</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Share this post with your followers or on other platforms
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 hover-scale"
                      onClick={() => {
                        handleShare(post.id);
                        // Close the dialog after sharing
                        const closeButton = document.querySelector('[data-dialog-close]');
                        if (closeButton instanceof HTMLElement) {
                          closeButton.click();
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share now
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 hover-scale"
                      onClick={async () => {
                        const url = `${window.location.origin}/post/${post.id}`;
                        await navigator.clipboard.writeText(url);
                        toast.success('Link copied to clipboard!');
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={activeCommentId === post.id} onOpenChange={(open) => setActiveCommentId(open ? post.id : null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Comments ({post.comments})</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto pr-4">
                {/* Existing Comments */}
                <div className="space-y-4 mb-4">
                  {post.commentsList.map((comment) => (
                    <div key={comment.id} className="flex gap-3 animate-fade-in">
                      <Avatar className="w-8 h-8">
                        <img src={comment.avatar} alt={comment.author} />
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm">{comment.author}</h4>
                            <span className="text-xs text-muted-foreground">{comment.time}</span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Like
                          </button>
                          <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <div className="flex gap-3 pt-4 border-t">
                  <Avatar className="w-8 h-8">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" alt="User" />
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-muted/50"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => submitComment(post.id)}
                        disabled={!commentText.trim()}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      ))}
    </div>
  );
}