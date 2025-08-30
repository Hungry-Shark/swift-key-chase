import { useState, useEffect } from "react";
import { TypingTest } from "@/components/TypingTest";
import { Leaderboard } from "@/components/Leaderboard";
import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Trophy, Keyboard, Timer, Target } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"test" | "leaderboard">("test");

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-teal-gold">
              TypeSpeed
            </h1>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex gap-2 justify-center">
            <Button
              variant={activeTab === "test" ? "default" : "outline"}
              onClick={() => setActiveTab("test")}
              className="gap-2"
            >
              <Timer className="h-4 w-4" />
              Typing Test
            </Button>
            <Button
              variant={activeTab === "leaderboard" ? "default" : "outline"}
              onClick={() => setActiveTab("leaderboard")}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </div>

          {/* Content */}
          {activeTab === "test" && <TypingTest user={user} />}
          {activeTab === "leaderboard" && (
            user ? (
              <Leaderboard />
            ) : (
              <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
                <Trophy className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Sign in to view the global leaderboard</h2>
                <p className="text-secondary">Login to see your ranking and compete with others.</p>
                <AuthButton className="text-lg px-8 py-3 mx-auto" />
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
