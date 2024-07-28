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

const AddNewInterview = () => {
  const [openDialogue, setOpenDialogue] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const onSubmit = (e) => {
    e.preventDefault();
    console.log(jobDesc, jobExperience, jobPosition);
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
                  <Button type="submit">Start Now</Button>
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
