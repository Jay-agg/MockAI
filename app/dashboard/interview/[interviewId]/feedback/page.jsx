"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Feedback = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const router = useRouter();

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    const result = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, params.interviewId))
      .orderBy(UserAnswer.id);

    setFeedbackList(result);
    calculateAverageScore(result);
  };

  const calculateAverageScore = (feedbackData) => {
    if (feedbackData.length === 0) return;

    const totalScore = feedbackData.reduce((sum, item) => {
      const rating = parseInt(item.rating, 10);
      return isNaN(rating) ? sum : sum + rating;
    }, 0);

    const maxPossibleScore = feedbackData.length * 5; // Assuming max rating per question is 5
    const scaledScore = (totalScore / maxPossibleScore) * 10;
    const finalScore = Math.min(Math.max(scaledScore, 0), 10); // Ensure score is between 0 and 10

    setAverageScore(finalScore.toFixed(2));
  };

  return (
    <div className="p-10">
      <h2 className="text-3xl font-bold text-green-500">Congratulations</h2>
      <h2 className="font-bold text-2xl mt-2">
        Here is your interview feedback
      </h2>
      {feedbackList.length == 0 ? (
        <h2 className="text-primary text-xl text-gray-500">
          No Interview Record Found
        </h2>
      ) : (
        <>
          <h2 className="text-stone-900 text-lg my-3">
            Your overall interview rating: <strong>{averageScore}/10</strong>
          </h2>
          <h2 className="text-sm text-gray-500">
            Find your detailed analysis below
          </h2>
          {feedbackList &&
            feedbackList.map((item, index) => (
              <Collapsible key={index} className="mt-7">
                <CollapsibleTrigger className="p-2 bg-secondary rounded-lg my-2 text-left flex justify-between w-full gap-7">
                  Q{index + 1 + ": "} {item.question}{" "}
                  <ChevronsUpDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-red-500 p-2 border rounded-lg">
                      <strong>Rating:</strong> {item.rating}
                    </h2>
                    <h2 className="p-2 border rounded-lg bg-red-50 text-sm text-red-900">
                      <strong>Your Answer: </strong>
                      {item.userAns}
                    </h2>
                    <h2 className="p-2 border rounded-lg bg-green-50 text-sm text-green-900">
                      <strong>Correct Answer: </strong>
                      {item.correctAns}
                    </h2>
                    <h2 className="p-2 border rounded-lg bg-blue-50 text-sm text-primary">
                      <strong>Feedback: </strong>
                      {item.feedback}
                    </h2>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
        </>
      )}

      <Button onClick={() => router.replace("/dashboard")}>Go Home</Button>
    </div>
  );
};

export default Feedback;
