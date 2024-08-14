import { Lightbulb, Volume2 } from "lucide-react";
import React from "react";

const QuestionsSection = ({ mockInterviewQuestions, activeQuestionIndex }) => {
  const textToSpeach = (text) => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech);
    } else "Sorry, Your browser does not support text to speech";
  };
  return (
    mockInterviewQuestions && (
      <div className="p-5 border rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mockInterviewQuestions &&
            mockInterviewQuestions.map((item, index) => (
              <div key={index}>
                <h2
                  className={`bg-secondary p-2 rounded-full text-xs md:text-sm text-center cursor-pointer ${
                    activeQuestionIndex === index && "bg-slate-800 text-white"
                  }`}
                >
                  Question #{index + 1}
                </h2>
              </div>
            ))}
        </div>
        <h2 className="my-5 text-md md:text-lg">
          {mockInterviewQuestions[activeQuestionIndex]?.question}
        </h2>
        <Volume2
          className="cursor-pointer"
          onClick={() =>
            textToSpeach(mockInterviewQuestions[activeQuestionIndex]?.question)
          }
        />
        <div className="border rounded-lg p-5 bg-blue-100 mt-10">
          <h2 className="flex gap-2 items-center">
            <Lightbulb />
            <strong>Note:</strong>
          </h2>
          <h2 className="text-sm text-black my-2">
            {process.env.NEXT_PUBLIC_QUESTION_NOTE}
          </h2>
        </div>
      </div>
    )
  );
};

export default QuestionsSection;
