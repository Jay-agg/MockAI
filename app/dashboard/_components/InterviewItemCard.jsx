import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import React from "react";

const InterviewItemCard = ({ interview, index }) => {
  const router = useRouter();
  const onStart = () => {
    router.push("/dashboard/interview/" + interview?.mockId);
  };
  const onFeedback = () => {
    router.push("dashboard/interview/" + interview.mockId + "/feedback");
  };
  return (
    <div className="border shadow-sm rounded-lg p-3">
      <h2 className="font-bold text-lg text-stone-800">
        {interview?.jobPosition}
      </h2>
      <h2 className="text-sm text-gray-600">
        {interview?.jobExperience} Years of Experience
      </h2>
      <h2 className="text-xs text-gray-500">
        Created At: {interview?.createdAt}
      </h2>
      <div className="flex mt-5 gap-5">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={onFeedback}
        >
          Feedback
        </Button>

        <Button size="sm" className="w-full" onClick={onStart}>
          Take Again
        </Button>
      </div>
    </div>
  );
};

export default InterviewItemCard;
