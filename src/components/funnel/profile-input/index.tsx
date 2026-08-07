"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, User, Users, Image as ImageIcon } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileInput() {
  const router = useRouter();
  const [inputUsername, setInputUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tempProfileData, setTempProfileData] = useState<Record<string, any> | null>(null);
  
  const { platformSlug, serviceSlug, setUsername, setProfileData } = useFunnelStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    setLoading(true);
    
    try {
      if (platformSlug === 'instagram') {
        const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(inputUsername)}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setTempProfileData(data.data);
          setShowConfirmModal(true);
        } else {
          toast.error("Profile not found. Please check the username.");
        }
      } else {
        // Direct pass for non-instagram platforms for now
        setUsername(inputUsername.replace('@', ''));
        router.push(`/${platformSlug}/${serviceSlug}/plans`);
      }
    } catch (error) {
      toast.error("Could not verify username at this moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProfile = () => {
    if (tempProfileData) {
      setUsername(tempProfileData.username);
      setProfileData(tempProfileData);
      setShowConfirmModal(false);
      router.push(`/${platformSlug}/${serviceSlug}/plans`);
    }
  };

  const handleRetry = () => {
    setShowConfirmModal(false);
    setTempProfileData(null);
    setInputUsername("");
  };

  return (
    <>
      <Card className="w-full max-w-xl mx-auto border-primary/20 bg-card/60 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Enter your Username</h2>
            <p className="text-muted-foreground">We never ask for your password.</p>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="@username or profile link"
                className="pl-12 pr-32 h-14 text-lg bg-background/50 border-muted-foreground/30 focus-visible:ring-primary/50"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                required
                disabled={loading}
              />
              <div className="absolute right-2">
                <Button type="submit" disabled={loading || !inputUsername.trim()} className="h-10 px-6 rounded-md">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-card/95 border-primary/20 backdrop-blur-md">
          <DialogHeader className="text-center sm:text-center pb-4">
            <DialogTitle className="text-2xl font-bold">Is this your profile?</DialogTitle>
          </DialogHeader>
          
          {tempProfileData && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={tempProfileData.profile_pic_url} alt={tempProfileData.username} />
                  <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                    {tempProfileData.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {tempProfileData.is_private && (
                  <div className="absolute -bottom-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full border-2 border-background">
                    PRIVATE
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">@{tempProfileData.username}</h3>
                <p className="text-muted-foreground font-medium">{tempProfileData.full_name}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-border/50">
                <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
                  <Users className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xl font-bold">{tempProfileData.follower_count?.toLocaleString() || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Followers</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
                  <User className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xl font-bold">{tempProfileData.following_count?.toLocaleString() || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Following</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
                  <ImageIcon className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xl font-bold">{tempProfileData.media_count?.toLocaleString() || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Posts</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:justify-center border-t border-border/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleRetry}
              className="w-full sm:w-auto h-12 px-8 font-medium"
            >
              Change Username
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmProfile}
              className="w-full sm:w-auto h-12 px-8 font-medium"
              disabled={tempProfileData?.is_private}
            >
              {tempProfileData?.is_private ? "Account is Private" : "Yes, this is me"}
            </Button>
          </DialogFooter>
          {tempProfileData?.is_private && (
            <p className="text-center text-xs text-destructive mt-2">
              Your account must be public to receive services.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}