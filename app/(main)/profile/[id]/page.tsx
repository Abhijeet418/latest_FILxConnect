"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Repeat } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/app/apiconnector/api";

const DEFAULT_AVATAR = 'https://res.cloudinary.com/djvat4mcp/image/upload/v1741243252/n4zfkrf62br7io8d2k0c.png';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    profilepic: DEFAULT_AVATAR
  });
  const [posts, setPosts] = useState([]);
  const [activeCommentsPost, setActiveCommentsPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
  }, [params.id]);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(`users/${params.id}`, 'GET');
      if (userData) {
        setUserProfile({
          name: userData.username || 'User',
          username: userData.username || 'username',
          email: userData.email || '',
          bio: userData.bio || '',
          profilepic: userData.profilePicture || DEFAULT_AVATAR
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user profile');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const rawPosts = await apiRequest(`posts/user/${params.id}`) || [];
      const activePosts = rawPosts.filter((post: any) => post.status === "1");

      const enrichedPosts = await Promise.all(activePosts.map(async (post: any) => {
        const reactionsList = await apiRequest(`reactions/posts/${post.id}`, 'GET') || [];
        const commentsList = await apiRequest(`comments/${post.id}`, 'GET') || [];

        return {
          id: post.id,
          content: post.content,
          time: new Date(post.createdAt).toLocaleString(),
          reactions: reactionsList.length,
          comments: commentsList.length,
          likedBy: reactionsList.map((reaction: any) => ({
            id: reaction.id,
            user: {
              username: reaction.username,
              avatar: reaction.user?.profilePicture || DEFAULT_AVATAR
            }
          })),
          commentsList: commentsList.map((comment: any) => ({
            id: comment.id,
            user: {
              username: comment.user.username,
              avatar: comment.user.profilePicture || DEFAULT_AVATAR
            },
            content: comment.content,
            createdAt: new Date(comment.createdAt).toLocaleString()
          })),
          mediaUrls: post.mediaUrls || []
        };
      }));

      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className="px-4 pt-8 pb-4 bg-gradient-to-b from-primary/5 to-background rounded-b-3xl">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <img src={userProfile.profilepic} alt={userProfile.name} className="object-cover" />
          </Avatar>
          <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
            <h1 className="text-2xl font-bold">{userProfile.name}</h1>
            <p className="text-muted-foreground">@{userProfile.username}</p>
            {userProfile.bio && (
              <p className="mt-2 text-muted-foreground">{userProfile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="px-4 mt-6">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id} className="p-4 mb-4 shadow-md post-card hover-scale transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  <img src={userProfile.profilepic} alt={userProfile.name} />
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{userProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{post.time}</p>
                </div>
              </div>

              <p className="mb-4">{post.content}</p>

              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="mb-4 grid gap-2">
                  {post.mediaUrls.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="rounded-lg w-full object-cover max-h-[512px]"
                    />
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.reactions}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
