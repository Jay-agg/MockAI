"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { Lightbulb, WebcamIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";

const Interview = (params) => {
  const [interviewData, setInterviewData] = useState();
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  useEffect(() => {
    GetInterviewData();
  }, []);
  const GetInterviewData = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, params.params.interviewId));

    setInterviewData(result[0]);
  };
  return (
    <div className="my-10  ">
      <h2 className="font-bold text-2xl">Let's Get Started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col my-5 ">
          <div className="flex flex-col gap-5 p-5 border rounded-lg">
            <h2 className="text-lg">
              <strong>Job Role:</strong>
              {interviewData?.jobPosition}
            </h2>
            <h2 className="text-lg">
              <strong>Job Description:</strong>
              {interviewData?.jobDesc}
            </h2>
            <h2 className="text-lg">
              <strong>Years of Experience:</strong>
              {interviewData?.jobExperience}
            </h2>
          </div>
          <div className="p-5 mt-5 border rounded-lg border-yellow-300 bg-yellow-100">
            <h2 className="flex gap-2 items-center text-yellow-500">
              <Lightbulb />
              <strong>Infomation</strong>
            </h2>
            <h2 className="mt-3">{process.env.NEXT_PUBLIC_INFORMATION}</h2>
          </div>
        </div>
        <div>
          {webcamEnabled ? (
            <div className=" flex flex-col justify-center items-center">
              <Webcam
                onUserMedia={() => setWebcamEnabled(true)}
                onUserMediaError={() => setWebcamEnabled(false)}
                mirrored={true}
                // style={{ height: 300, width: 200 }}<Webcam

                style={{ height: 300, width: "100%", zIndex: 10 }}
              />
              <Link
                href={
                  "/dashboard/interview/" + params.params.interviewId + "/start"
                }
              >
                <Button className="ml-5 mt-5">Start Interview</Button>
              </Link>
            </div>
          ) : (
            <>
              <WebcamIcon className="h-72 my-7 w-full p-16 bg-secondary rounded" />
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setWebcamEnabled(true);
                  }}
                  variant="ghost"
                  className=" bg-slate-50 p-3"
                >
                  Enable WebCam and Microphone
                </Button>
                <Link
                  href={
                    "/dashboard/interview/" +
                    params.params.interviewId +
                    "/start"
                  }
                >
                  <Button className="ml-5 ">Start Interview</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interview;
