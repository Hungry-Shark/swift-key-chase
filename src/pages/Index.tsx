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
        {user ? (
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
            {activeTab === "test" && <TypingTest />}
            {activeTab === "leaderboard" && <Leaderboard />}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold gradient-teal-gold">
                TypeSpeed
              </h1>
              <p className="text-xl text-secondary max-w-2xl mx-auto">
                Test and improve your typing speed with various practice modes. 
                Compete with others and track your progress over time.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Timer className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-lg font-semibold">Timed Tests</h3>
                  <p className="text-secondary">
                    15, 30, 60, or 120 second typing tests to measure your WPM and accuracy
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Target className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-lg font-semibold">Accuracy Tracking</h3>
                  <p className="text-secondary">
                    Monitor your typing accuracy and see detailed statistics for improvement
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Trophy className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-lg font-semibold">Global Leaderboard</h3>
                  <p className="text-secondary">
                    Compete with other typists and see how you rank globally
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <AuthButton className="text-lg px-8 py-3" />
              <p className="text-sm text-secondary mt-2">
                Sign in to start testing your typing speed
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
