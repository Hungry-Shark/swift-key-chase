import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Clock, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  wpm: number;
  accuracy: number;
  raw_wpm: number;
  duration: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface LeaderboardProps {
  timeframe?: "today" | "week" | "month" | "all";
  limit?: number;
}

export const Leaderboard = ({ timeframe = "all", limit = 10 }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number | "all">("all");

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, selectedDuration]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    let query = supabase
      .from("typing_tests")
      .select(`
        id,
        wpm,
        accuracy,
        raw_wpm,
        duration,
        created_at,
        profiles (
          username,
          avatar_url
        )
      `)
      .order("wpm", { ascending: false })
      .limit(limit);

    // Filter by timeframe
    if (timeframe !== "all") {
      const now = new Date();
      let dateFilter = new Date();
      
      switch (timeframe) {
        case "today":
          dateFilter.setHours(0, 0, 0, 0);
          break;
        case "week":
          dateFilter.setDate(now.getDate() - 7);
          break;
        case "month":
          dateFilter.setMonth(now.getMonth() - 1);
          break;
      }
      
      query = query.gte("created_at", dateFilter.toISOString());
    }

    // Filter by duration
    if (selectedDuration !== "all") {
      query = query.eq("duration", selectedDuration);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leaderboard:", error);
    } else {
      setEntries(data || []);
    }
    
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-medium">{rank}</span>;
    }
  };

  const getWpmBadgeVariant = (wpm: number) => {
    if (wpm >= 80) return "default";
    if (wpm >= 60) return "secondary";
    return "outline";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
        
        {/* Duration Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", 15, 30, 60, 120].map((duration) => (
            <Badge
              key={duration}
              variant={selectedDuration === duration ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedDuration(duration)}
            >
              {duration === "all" ? "All" : `${duration}s`}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No results found for the selected criteria
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index + 1)}
                </div>
                
                <Avatar className="w-8 h-8">
                  <AvatarImage src={entry.profiles?.avatar_url} />
                  <AvatarFallback>
                    {entry.profiles?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {entry.profiles?.username || "Anonymous"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {entry.duration}s
                    <Target className="w-3 h-3" />
                    {entry.accuracy.toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getWpmBadgeVariant(entry.wpm)}
                    className="flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    {entry.wpm} WPM
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};