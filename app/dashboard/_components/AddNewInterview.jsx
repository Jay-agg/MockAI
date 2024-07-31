"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/GeminiAIModel";
import { LoaderCircle } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { db } from "@/utils/db";
import { useRouter } from "next/navigation";

const AddNewInterview = () => {
  const [openDialogue, setOpenDialogue] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState([]);
  const { user } = useUser();
  const router = useRouter();
  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    console.log(jobDesc, jobExperience, jobPosition);

    const InputPrompt =
      "Job Position:" +
      jobPosition +
      ", Job Description:" +
      jobDesc +
      ", Years of Experience:" +
      jobExperience +
      ". Depending on the Job position, Job Description and Years of Experience, give me top 10 interview questions from the mentioned job description(make sure there is at least one question from each technology mentioned if it is a technical positon interview) along with the answer in JSON format. Give me questions and answer field on JSON";

    const result = await chatSession.sendMessage(InputPrompt);

    const MockJSONResponse = result.response
      .text()
      .replace("```json", "")
      .replace("```", "");
    setJsonResponse(MockJSONResponse);
    console.log(JSON.parse(MockJSONResponse));
    console.log(moment().format("DD-MM-YYYY"));

    const resp = await db
      .insert(MockInterview)
      .values({
        mockId: uuidv4(),
        jsonMockResp: MockJSONResponse,
        jobPosition: jobPosition,
        jobDesc: jobDesc,
        jobExperience: jobExperience,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-yyyy"),
      })
      .returning({ mockId: MockInterview.mockId });

    console.log("Inserted ID:", resp);

    if (resp) {
      setOpenDialogue(false);
      router.push("/dashboard/interview/" + resp[0]?.mockId);
    } else {
      console.log("ERROR");
    }

    setLoading(false);
  };
  return (
    <div>
      <div
        className="p-10 border rounded-lg bg-secondary hover:scale-104 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDialogue(true)}
      >
        <h2 className="font-bold text-lg text-center">+ Add New</h2>
      </div>
      <Dialog open={openDialogue}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Tell us more about your job interview
            </DialogTitle>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                <div>
                  <h2>
                    Add details about your job positon/role, Job description and
                    Years of experience
                  </h2>
                  <div className="mt-7 my-3">
                    <label>Job Role/Job Position</label>
                    <Input
                      placeholder="Ex. Full Stack Developer"
                      required
                      onChange={(event) => {
                        setJobPosition(event.target.value);
                      }}
                    />
                  </div>
                  <div className="mt-7 my-3">
                    <label>Job Desc/Tech Stack</label>
                    <Textarea
                      placeholder="Ex. React, Angular, NodeJS, MySQL"
                      required
                      onChange={(event) => {
                        setJobDesc(event.target.value);
                      }}
                    />
                  </div>
                  <div className="mt-7 my-3">
                    <label>Years of Experience</label>
                    <Input
                      placeholder="Ex. 5"
                      type="number"
                      max="50"
                      required
                      onChange={(event) => {
                        setJobExperience(event.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-5 justify-end pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenDialogue(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        Generating
                      </>
                    ) : (
                      "Start Now"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewInterview;
