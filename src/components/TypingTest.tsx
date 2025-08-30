import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, User, Trophy, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TypingTestProps {
  onComplete?: (result: TestResult) => void;
}

interface TestResult {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  correctCharacters: number;
  incorrectCharacters: number;
  extraCharacters: number;
  missedCharacters: number;
  totalCharacters: number;
  duration: number;
  testText: string;
  typedText: string;
}

const WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "for", "not", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

const TEST_DURATIONS = [15, 30, 60, 120];

export const TypingTest = ({ onComplete }: TypingTestProps) => {
  const [testText, setTestText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [rawWpm, setRawWpm] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateText = useCallback(() => {
    const wordCount = Math.max(selectedDuration * 3, 50); // Estimate words needed
    const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
    const selectedWords = [];
    
    for (let i = 0; i < wordCount; i++) {
      selectedWords.push(shuffled[i % shuffled.length]);
    }
    
    return selectedWords.join(" ");
  }, [selectedDuration]);

  const resetTest = useCallback(() => {
    const newText = generateText();
    setTestText(newText);
    setTypedText("");
    setCurrentIndex(0);
    setIsActive(false);
    setTimeLeft(selectedDuration);
    setStartTime(null);
    setWpm(0);
    setRawWpm(0);
    setAccuracy(100);
    setIsCompleted(false);
    inputRef.current?.focus();
  }, [generateText, selectedDuration]);

  useEffect(() => {
    resetTest();
  }, [selectedDuration, resetTest]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const calculateStats = useCallback(() => {
    if (!startTime) return { wpm: 0, rawWpm: 0, accuracy: 100 };
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const typedChars = typedText.length;
    const correctChars = typedText.split("").filter((char, index) => char === testText[index]).length;
    
    const rawWpm = Math.round(typedChars / 5 / timeElapsed) || 0;
    const wpm = Math.round(correctChars / 5 / timeElapsed) || 0;
    const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100;
    
    return { wpm, rawWpm, accuracy };
  }, [startTime, typedText, testText]);

  useEffect(() => {
    if (isActive) {
      const stats = calculateStats();
      setWpm(stats.wpm);
      setRawWpm(stats.rawWpm);
      setAccuracy(stats.accuracy);
    }
  }, [typedText, isActive, calculateStats]);

  const handleTestComplete = async () => {
    if (isCompleted) return;
    
    setIsActive(false);
    setIsCompleted(true);
    
    const stats = calculateStats();
    
    // Calculate detailed character statistics
    const correctCharacters = typedText.split("").filter((char, index) => char === testText[index]).length;
    const incorrectCharacters = typedText.split("").filter((char, index) => char !== testText[index] && index < testText.length).length;
    const extraCharacters = Math.max(0, typedText.length - testText.length);
    const missedCharacters = Math.max(0, testText.length - typedText.length);
    const totalCharacters = testText.length;
    
    const result: TestResult = {
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      rawWpm: stats.rawWpm,
      correctCharacters,
      incorrectCharacters,
      extraCharacters,
      missedCharacters,
      totalCharacters,
      duration: selectedDuration,
      testText,
      typedText,
    };
    
    // Save to database
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("typing_tests").insert({
        user_id: user.user?.id || null,
        wpm: result.wpm,
        accuracy: result.accuracy,
        raw_wpm: result.rawWpm,
        correct_characters: result.correctCharacters,
        incorrect_characters: result.incorrectCharacters,
        extra_characters: result.extraCharacters,
        missed_characters: result.missedCharacters,
        total_characters: result.totalCharacters,
        duration: result.duration,
        mode: "time",
        difficulty: "normal",
        language: "english",
        test_text: result.testText,
        typed_text: result.typedText,
      });
      
      if (error) {
        console.error("Error saving test result:", error);
        toast.error("Failed to save test result");
      } else {
        toast.success("Test result saved!");
      }
    } catch (error) {
      console.error("Error saving test result:", error);
    }
    
    onComplete?.(result);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!isActive && value.length > 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    
    if (value.length <= testText.length) {
      setTypedText(value);
      setCurrentIndex(value.length);
      
      // Check if test is complete
      if (value.length === testText.length) {
        handleTestComplete();
      }
    }
  };

  const renderText = () => {
    return testText.split("").map((char, index) => {
      let className = "transition-typing";
      
      if (index < typedText.length) {
        if (typedText[index] === char) {
          className += " text-typing-correct bg-typing-correct";
        } else {
          className += " text-typing-incorrect bg-typing-incorrect";
        }
      } else if (index === currentIndex) {
        className += " text-typing-current relative";
      } else {
        className += " text-typing-default";
      }
      
      return (
        <span key={index} className={className}>
          {char}
          {index === currentIndex && (
            <span className="absolute left-0 top-0 h-full w-0.5 bg-primary animate-typing-cursor" />
          )}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Duration Selection */}
      <div className="flex gap-2 justify-center">
        {TEST_DURATIONS.map((duration) => (
          <Button
            key={duration}
            variant={selectedDuration === duration ? "default" : "secondary"}
            size="sm"
            onClick={() => {
              setSelectedDuration(duration);
            }}
            disabled={isActive}
            className="min-w-16"
          >
            {duration}s
          </Button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 justify-center">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeLeft}s
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          {wpm} WPM
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {accuracy}%
        </Badge>
      </div>

      {/* Typing Area */}
      <Card className="p-8 relative">
        <div 
          className="text-lg leading-relaxed font-mono select-none cursor-text min-h-32"
          onClick={() => inputRef.current?.focus()}
        >
          {renderText()}
        </div>
        
        <input
          ref={inputRef}
          value={typedText}
          onChange={handleInputChange}
          disabled={isCompleted || timeLeft === 0}
          className="absolute opacity-0 pointer-events-none"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        
        {/* Overlay for completed test */}
        {(isCompleted || timeLeft === 0) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Test Complete!</h3>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">{wpm} WPM</div>
                <div className="text-lg">Accuracy: {accuracy}%</div>
                <div className="text-sm text-muted-foreground">Raw WPM: {rawWpm}</div>
              </div>
              <Button onClick={resetTest} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Instructions */}
      {!isActive && !isCompleted && (
        <div className="text-center text-muted-foreground">
          Click on the text area and start typing to begin the test
        </div>
      )}
    </div>
  );
};