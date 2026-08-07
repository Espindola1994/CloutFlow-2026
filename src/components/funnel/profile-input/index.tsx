"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { useFunnelStore } from "@/stores/funnel.store";
import { toast } from "sonner";

export function ProfileInput() {
  const router = useRouter();
  const [inputUsername, setInputUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { platformSlug, serviceSlug, setUsername, setProfileData } = useFunnelStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    setLoading(true);
    
    // Simulate API lookup delay or hit actual endpoint
    try {
      if (platformSlug === 'instagram') {
        const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(inputUsername)}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setUsername(data.data.username);
          setProfileData(data.data);
          router.push(`/${platformSlug}/${serviceSlug}/plans`);
        } else {
          // Fallback to manual entry if API fails
          setUsername(inputUsername.replace('@', ''));
          router.push(`/${platformSlug}/${serviceSlug}/plans`);
        }
      } else {
        // Direct pass for non-instagram platforms for now
        setUsername(inputUsername.replace('@', ''));
        router.push(`/${platformSlug}/${serviceSlug}/plans`);
      }
    } catch (error) {
      toast.error("Could not verify username, but you can proceed.");
      setUsername(inputUsername.replace('@', ''));
      router.push(`/${platformSlug}/${serviceSlug}/plans`);
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}