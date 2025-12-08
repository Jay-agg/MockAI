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
import { LoaderCircle, Upload } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { db } from "@/utils/db";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AddNewInterview = () => {
  const [openDialogue, setOpenDialogue] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState([]);
  const [interviewMode, setInterviewMode] = useState("ai"); 
  const [uploadedFile, setUploadedFile] = useState(null);
  const { user } = useUser();
  const router = useRouter();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
        toast.success("File uploaded successfully!");
      } else {
        toast.error("Please upload a PDF or Word document");
        e.target.value = null;
      }
    }
  };

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    
    try {
      let MockJSONResponse;

      if (interviewMode === "document") {
        if (!uploadedFile) {
          toast.error("Please upload a document");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", uploadedFile);

        const uploadResponse = await fetch("/api/upload-document", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          toast.error(uploadResult.error || "Failed to process document");
          setLoading(false);
          return;
        }

        MockJSONResponse = uploadResult.data;
        console.log("Document processed:", MockJSONResponse);
      } else {
        // Handle AI-generated questions
        console.log(jobDesc, jobExperience, jobPosition);

        const InputPrompt =
          "Job Position:" +
          jobPosition +
          ", Job Description:" +
          jobDesc +
          ", Years of Experience:" +
          jobExperience +
          ". Depending on the Job position, Job Description and Years of Experience, give me top 10 interview questions from the mentioned job description(make sure there is at least one question from each technology mentioned if it is a technical position interview) along with the answer in JSON format. Give me 'question' and 'answer' fields in JSON with the structure {\"interviewQuestions\": [{\"question\": \"...\", \"answer\": \"...\"}]}. IMPORTANT: Return ONLY the JSON response without any markdown formatting, explanation, or additional text. The response will be directly parsed as JSON.";

        const result = await chatSession.sendMessage(InputPrompt);

        MockJSONResponse = result.response
          .text()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .replace(/^[^{]*({[\s\S]*})[^}]*$/g, "$1")
          .trim();
      }

      setJsonResponse(MockJSONResponse);
      console.log("Final JSON Response:", MockJSONResponse);
      

      let parsedJSON;
      try {
        parsedJSON = JSON.parse(MockJSONResponse);
        console.log("Parsed JSON:", parsedJSON);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response that failed to parse:", MockJSONResponse);
        toast.error("Failed to parse AI response. Please try again.");
        setLoading(false);
        return;
      }

      const resp = await db
        .insert(MockInterview)
        .values({
          mockId: uuidv4(),
          jsonMockResp: MockJSONResponse,
          jobPosition: jobPosition || "Document-based Interview",
          jobDesc: jobDesc || "Questions from uploaded document",
          jobExperience: jobExperience || "N/A",
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format("DD-MM-yyyy"),
          isDocumentBased: interviewMode === "document",
        })
        .returning({ mockId: MockInterview.mockId })
        .catch((error) => {
          console.error("Database insert error:", error);
          throw error;
        });

      if (resp) {
        console.log("Interview created successfully:", resp);
        toast.success("Interview created successfully!");
        setOpenDialogue(false);
        router.push("/dashboard/interview/" + resp[0]?.mockId);
      } else {
        console.error("Failed to create interview - no response");
        toast.error("Failed to create interview");
      }
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview: " + error.message);
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
                  {/* Mode Selection */}
                  <div className="mb-6">
                    <h2 className="mb-3 font-semibold">Choose Interview Type:</h2>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={interviewMode === "ai" ? "default" : "outline"}
                        onClick={() => setInterviewMode("ai")}
                        className="flex-1"
                      >
                        AI Generated Questions
                      </Button>
                      <Button
                        type="button"
                        variant={interviewMode === "document" ? "default" : "outline"}
                        onClick={() => setInterviewMode("document")}
                        className="flex-1"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </div>
                  </div>

                  {/* AI Mode Fields */}
                  {interviewMode === "ai" && (
                    <div>
                      <h2 className="mb-3">
                        Add details about your job position/role, Job description and
                        Years of experience
                      </h2>
                      <div className="mt-7 my-3">
                        <label>Job Role/Job Position</label>
                        <Input
                          placeholder="Ex. Full Stack Developer"
                          required
                          value={jobPosition}
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
                          value={jobDesc}
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
                          value={jobExperience}
                          onChange={(event) => {
                            setJobExperience(event.target.value);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Document Upload Mode */}
                  {interviewMode === "document" && (
                    <div>
                      <h2 className="mb-3">
                        Upload a document with interview questions and answers
                      </h2>
                      <div className="mt-7 my-3">
                        <label className="block mb-2">
                          Upload Document (PDF or Word)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            required
                            onChange={handleFileChange}
                            className="cursor-pointer"
                          />
                          {uploadedFile && (
                            <p className="mt-2 text-sm text-green-600">
                              ✓ {uploadedFile.name}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          The document should contain questions and their answers.
                          The AI will parse and extract them automatically.
                        </p>
                      </div>
                      
                      {/* Optional metadata for document-based interviews */}
                      <div className="mt-7 my-3">
                        <label>Interview Title (Optional)</label>
                        <Input
                          placeholder="Ex. Python Developer Interview"
                          value={jobPosition}
                          onChange={(event) => {
                            setJobPosition(event.target.value);
                          }}
                        />
                      </div>
                      <div className="mt-7 my-3">
                        <label>Description (Optional)</label>
                        <Textarea
                          placeholder="Ex. Interview questions for senior Python developer"
                          value={jobDesc}
                          onChange={(event) => {
                            setJobDesc(event.target.value);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-5 justify-end pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpenDialogue(false);
                      setInterviewMode("ai");
                      setUploadedFile(null);
                      setJobPosition("");
                      setJobDesc("");
                      setJobExperience("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        {interviewMode === "document" ? "Processing Document..." : "Generating..."}
                      </>
                    ) : (
                      "Start Interview"
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
