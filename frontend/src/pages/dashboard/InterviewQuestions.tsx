import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Lightbulb,
  Loader2,
  FileText,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useMatch, InterviewQuestionsData } from "@/hooks/useMatch";
import { usePayment } from "@/hooks/usePayment";

export default function InterviewQuestions() {
  const {
    matches,
    fetchMatches,
    loading,
    interviewQuestions,
    interviewLoading,
    fetchInterviewQuestions,
    error,
  } = useMatch();
  const { subscription, fetchSubscription } = usePayment();

  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [questionsData, setQuestionsData] =
    useState<InterviewQuestionsData | null>(interviewQuestions);

  useEffect(() => {
    fetchMatches();
    fetchSubscription();
  }, [fetchMatches, fetchSubscription]);

  const usage = subscription?.usage?.interview_questions_used ?? 0;
  const limit = subscription?.limits?.interview_questions ?? 5;
  const isUnlimited = limit === "Infinity" || limit === Infinity;
  const numericLimit = isUnlimited ? Infinity : Number(limit);
  const usagePercent = isUnlimited
    ? 0
    : Math.min((usage / numericLimit) * 100, 100);
  const limitReached = !isUnlimited && usage >= numericLimit;
  const remaining = isUnlimited ? 20 : Math.max(numericLimit - usage, 0);
  const sliderMax = Math.min(20, remaining);
  const sliderMin = Math.min(1, sliderMax);

  // Keep numberOfQuestions within allowed range when subscription changes
  useEffect(() => {
    if (numberOfQuestions > sliderMax && sliderMax > 0) {
      setNumberOfQuestions(sliderMax);
    }
  }, [sliderMax, numberOfQuestions]);

  const handleGenerate = async () => {
    if (!selectedMatchId) return;
    try {
      const result = await fetchInterviewQuestions({
        matchId: selectedMatchId,
        difficulty,
        numberOfQuestions,
      });
      setQuestionsData(result);
      fetchSubscription();
    } catch (err) {
      console.error("Failed to generate questions:", err);
    }
  };

  const toggleQuestion = (id: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Technical":
        return <Target className="h-4 w-4" />;
      case "Behavioral":
        return <MessageSquare className="h-4 w-4" />;
      case "Situational":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const hasMatches = matches.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Interview Questions</h1>
        <p className="text-muted-foreground">
          Generate personalized interview questions based on your resume and job
          match with tips on how to answer them.
        </p>
      </div>

      {/* Usage Indicator */}
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Interview Questions Generated</span>
            <Badge variant={limitReached ? "destructive" : "secondary"}>
              {usage} / {isUnlimited ? "∞" : numericLimit}
            </Badge>
          </div>
          {!isUnlimited && <Progress value={usagePercent} className="h-2" />}
        </div>
      </div>

      {limitReached && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            You've reached your interview question limit. Upgrade your plan to
            generate more.
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasMatches ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No resume-job matches available</p>
              <p className="text-sm">
                Create a match in the Match Results page first
              </p>
            </div>
          ) : (
            <>
              {/* Match Selection */}
              <div className="space-y-2">
                <Label>Select Resume-Job Match</Label>
                <Select
                  value={selectedMatchId}
                  onValueChange={setSelectedMatchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a match" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map((match) => (
                      <SelectItem key={match._id} value={match._id}>
                        <span className="flex items-center gap-2">
                          <span>
                            {typeof match.resume === "object"
                              ? (match.resume as { name?: string })?.name ||
                                "Resume"
                              : "Resume"}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span>
                            {typeof match.jobDescription === "object"
                              ? (
                                  match.jobDescription as {
                                    title?: string;
                                    company?: string;
                                  }
                                )?.title || "Job"
                              : "Job"}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {match.matchScore}%
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty & Number of Questions */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Difficulty Level</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(val: "easy" | "medium" | "hard") =>
                      setDifficulty(val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Easy - Basic concepts & fundamentals
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />
                          Medium - Practical application
                        </span>
                      </SelectItem>
                      <SelectItem value="hard">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Hard - Advanced scenarios
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Number of Questions</Label>
                    <span className="text-sm font-medium">
                      {numberOfQuestions}
                    </span>
                  </div>
                  <Slider
                    value={[numberOfQuestions]}
                    onValueChange={(val) => setNumberOfQuestions(val[0])}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    className="py-2"
                    disabled={limitReached}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{sliderMin}</span>
                    <span>{sliderMax}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedMatchId || interviewLoading || limitReached}
                className="w-full gradient-primary border-0"
              >
                {interviewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  "Generate Questions"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Questions Metadata */}
      {questionsData?.metadata && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Job:</span>
                <span className="font-medium">
                  {questionsData.metadata.jobTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Level:</span>
                <Badge variant="secondary">
                  {questionsData.metadata.experienceLevel}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Difficulty:</span>
                <Badge
                  className={getDifficultyColor(
                    questionsData.metadata.difficulty,
                  )}
                >
                  {questionsData.metadata.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">
                  {questionsData.metadata.totalQuestions}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {questionsData?.questions && questionsData.questions.length > 0 && (
        <div className="space-y-4">
          {questionsData.questions.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardContent className="p-0">
                <button
                  onClick={() => toggleQuestion(item.id)}
                  className="w-full p-5 text-left flex items-start gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <Badge
                        className={`text-xs ${getDifficultyColor(item.difficulty)}`}
                      >
                        {item.difficulty}
                      </Badge>
                    </div>
                    <p className="font-medium">{item.question}</p>
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {expandedQuestions.has(item.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {expandedQuestions.has(item.id) && (
                  <div className="px-5 pb-5 space-y-4 border-t bg-muted/30">
                    {/* Tip */}
                    <div className="pt-4">
                      <div className="flex items-start gap-2 p-4 rounded-lg bg-background border">
                        <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                            How to Answer
                          </p>
                          <p className="text-sm">{item.tip}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sample Answer Outline */}
                    {item.sampleAnswerOutline && (
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1 uppercase tracking-wider">
                          Key Points to Cover
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {item.sampleAnswerOutline}
                        </p>
                      </div>
                    )}

                    {/* Related Skills & Topics */}
                    <div className="flex flex-wrap gap-4">
                      {item.relatedSkills?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Related Skills
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedSkills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.expectedTopics?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Expected Topics
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.expectedTopics.map((topic, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
