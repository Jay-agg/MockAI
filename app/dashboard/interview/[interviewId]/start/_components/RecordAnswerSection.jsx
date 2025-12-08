"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/utils/db";
import { chatSession } from "@/utils/GeminiAIModel";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { Mic, WebcamIcon } from "lucide-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import useSpeechToText from "react-hook-speech-to-text";
import Webcam from "react-webcam";
import { toast } from "sonner";

const RecordAnswerSection = ({
  interviewData,
  mockInterviewQuestions,
  activeQuestionIndex,
}) => {
  const [answer, setAnswer] = useState();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    results.map((result) =>
      setAnswer((prevAns) => prevAns + result?.transcript)
    );
  }, [results]);

  useEffect(() => {
    if (!isRecording && answer?.length > 10) {
      UpdateUserAnswer();
    }
  }, [answer]);

  const StartStopRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };
  const UpdateUserAnswer = async () => {
    setLoading(true);
    const questions = mockInterviewQuestions?.interviewQuestions || [];
    const currentQuestion = questions[activeQuestionIndex];
    
    const feedbackPrompt =
      "Question: " +
      currentQuestion?.question +
      "\n\nUser Answer: " +
      answer +
      "\n\nCorrect/Expected Answer: " +
      currentQuestion?.answer +
      "\n\nBased on the question, user's answer, and the correct answer provided, please evaluate the user's response. " +
      "Compare the user's answer with the expected answer and provide: " +
      "1. A rating out of 5 (where 5 is excellent and matches the expected answer closely) " +
      "2. Constructive feedback in 3-5 lines highlighting what was good and what could be improved " +
      "3. Mention any key points from the correct answer that were missed " +
      "Return the response in JSON format with 'rating' and 'feedback' fields only. Do not include any markdown formatting.";

    const result = await chatSession.sendMessage(feedbackPrompt);
    const mockJsonResp = result.response
      .text()
      .replace("```json", "")
      .replace("```", "");

    const JsonFeedbackResp = JSON.parse(mockJsonResp);

    const resp = await db.insert(UserAnswer).values({
      mockIdRef: interviewData?.mockId,
      question: currentQuestion?.question,
      correctAns: currentQuestion?.answer,
      userAns: answer,
      feedback: JsonFeedbackResp?.feedback,
      rating: JsonFeedbackResp.rating,
      userEmail: user?.primaryEmailAddress.emailAddress,
      createdAt: moment().format("DD-MM-yyyy"),
    });
    if (resp) {
      toast("User Answer recorded successfully");
      setAnswer("");
      setResults([]);
    }
    setAnswer("");
    setResults([]);
    setLoading(false);
  };
  return (
    <div className="flex flex-col justify-center items-center ">
      <div className="flex flex-col justify-center items-center  my-20">
        <WebcamIcon className="h-1/3 my-7 w-1/3 bg-secondary rounded absolute" />
        <Webcam
          mirrored={true}
          style={{ height: 300, width: "100%", zIndex: 10 }}
        />
      </div>
      <Button
        disabled={loading}
        variant="outline"
        className="my-5"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <h2 className="text-red-700 flex gap-2">
            <Mic /> Stop Recording
          </h2>
        ) : (
          "Record Answer"
        )}
      </Button>
    </div>
  );
};

export default RecordAnswerSection;
