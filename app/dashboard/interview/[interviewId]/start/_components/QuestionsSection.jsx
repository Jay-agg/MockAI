import React from "react";

const QuestionsSection = ({ mockInterviewQuestions, activeQuestionIndex }) => {
  console.log(mockInterviewQuestions);
  return (
    <div className="p-5 border rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {mockInterviewQuestions &&
          mockInterviewQuestions.map((item, index) => (
            <div>
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
    </div>
  );
};

export default QuestionsSection;
