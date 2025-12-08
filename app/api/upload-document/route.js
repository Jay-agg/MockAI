import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import OpenAI from "openai";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  let tempFilePath = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = "";

    // Extract text
    if (fileName.endsWith(".pdf")) {
      console.log("Processing PDF file...");
      const PDFParser = require("pdf2json");
      
      tempFilePath = join(tmpdir(), `upload-${Date.now()}.pdf`);
      console.log("Created temp file at:", tempFilePath);
      await writeFile(tempFilePath, buffer);
      console.log("Wrote buffer to temp file, size:", buffer.length);

      // Parse PDF
      extractedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        let timeout = setTimeout(() => {
          reject(new Error("PDF parsing timed out after 30 seconds"));
        }, 30000);

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          clearTimeout(timeout);
          try {
            console.log("PDF data ready, pages:", pdfData.Pages ? pdfData.Pages.length : 0);
            // Extract text from all pages
            let text = "";
            if (pdfData.Pages) {
              pdfData.Pages.forEach((page, pageIndex) => {
                if (page.Texts) {
                  page.Texts.forEach((textItem) => {
                    if (textItem.R) {
                      textItem.R.forEach((run) => {
                        if (run.T) {
                          // Decode and clean the text
                          let decoded = decodeURIComponent(run.T);
                          // Remove extra spaces and normalize
                          decoded = decoded.replace(/\s+/g, ' ');
                          text += decoded + " ";
                        }
                      });
                    }
                  });
                  text += " "; // Add space between text blocks
                }
              });
            }
            // Clean up the final text - fix the spaced-out characters issue from pdf2json
            // Check if text has the pattern where every character is separated by spaces
            const sample = text.substring(0, 200).replace(/\s+/g, ' ');
            const singleCharWords = sample.split(' ').filter(w => w.length === 1).length;
            const totalWords = sample.split(' ').length;
            
            console.log("Sample analysis - single char words:", singleCharWords, "total:", totalWords);
            
            // If more than 50% are single character "words", we have spaced-out text
            if (totalWords > 0 && (singleCharWords / totalWords) > 0.5) {
              console.log("Detected spaced-out text, fixing word boundaries...");
              
              // Strategy: pdf2json gives us "H e l l o   W o r l d" (note double space between words)
              // First normalize to single spaces, then intelligently re-add word boundaries
              text = text.replace(/\s+/g, ' ');
              
              // Now we have "H e l l o W o r l d" - single chars separated by single space
              // We need to identify where actual word boundaries should be
              // Word boundaries typically occur before:
              // 1. Capital letters (start of new word)
              // 2. After punctuation
              // 3. Before numbers
              
              let result = '';
              const chars = text.split(' '); // Split by spaces
              
              for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                const prevChar = i > 0 ? chars[i - 1] : '';
                const nextChar = i < chars.length - 1 ? chars[i + 1] : '';
                
                result += char;
                
                // Decide if we need a space after this character
                const needsSpace = 
                  // Space after punctuation
                  /[.!?,;:]/.test(char) ||
                  // Space before capital letter (if current is lowercase or punctuation)
                  (/[a-z0-9)]/.test(char) && /[A-Z]/.test(nextChar)) ||
                  // Space after closing quotes/parens
                  /[)'"]/.test(char) ||
                  // Space before opening quotes/parens (if not at start)
                  (result.length > 1 && /[("']/.test(nextChar) && !/[\s]/.test(char)) ||
                  // Space after numbers before letters
                  (/[0-9]/.test(char) && /[A-Za-z]/.test(nextChar)) ||
                  // Space after lowercase before number
                  (/[a-z]/.test(char) && /[0-9]/.test(nextChar));
                
                if (needsSpace && i < chars.length - 1) {
                  result += ' ';
                }
              }
              
              text = result;
            }
            
            // Final cleanup
            text = text
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .replace(/\s+([.,!?;:])/g, '$1') // Remove spaces before punctuation  
              .replace(/([.!?:])\s*/g, '$1 ') // Ensure space after punctuation
              .replace(/(\d+)\.\s+/g, '$1. ') // Fix numbered lists
              .replace(/\s+$/gm, '') // Remove trailing spaces on lines
              .trim();
            
            console.log("Final extracted text length:", text.length);
            resolve(text);
          } catch (error) {
            console.error("Error in pdfParser_dataReady:", error);
            reject(error);
          }
        });

        pdfParser.on("pdfParser_dataError", (error) => {
          clearTimeout(timeout);
          console.error("PDF parser error:", error);
          reject(new Error(error.parserError || "PDF parsing failed"));
        });

        console.log("Loading PDF...");
        pdfParser.loadPDF(tempFilePath);
      });

    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload PDF or Word document." },
        { status: 400 }
      );
    }

    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from the document" },
        { status: 400 }
      );
    }

    console.log("Extracted text length:", extractedText.length);
    console.log("Extracted text preview:", extractedText.substring(0, 500));

    const MAX_CHUNK_SIZE = 15000; 
    let textToProcess = extractedText;
    

    if (extractedText.length > MAX_CHUNK_SIZE) {
      console.log("Large document detected, using intelligent chunking...");
      
      const questionPatterns = [
        /questions?\s*(?:and|&)?\s*answers?/i,
        /interview\s*questions?/i,
        /q\s*&?\s*a/i,
        /^\s*\d+\.\s*[A-Z]/m, // Numbered questions
        /^q\d*[:.]/im, // Q1: or Q:
      ];
      
      let bestStart = 0;
      for (const pattern of questionPatterns) {
        const match = extractedText.match(pattern);
        if (match && match.index !== undefined) {
          bestStart = Math.max(0, match.index - 100); // Include a bit before
          console.log("Found Q&A section at position:", match.index);
          break;
        }
      }
      
      // Extract a reasonable chunk from the best starting position
      textToProcess = extractedText.substring(bestStart, bestStart + MAX_CHUNK_SIZE);
      console.log("Using chunk from position", bestStart, "to", bestStart + MAX_CHUNK_SIZE);
    }

    // Use AI to parse questions and answers from the extracted text
    const parsePrompt = `
You are given a document that should contain interview questions and their answers. The text may have spacing issues where words are joined together or have inconsistent spacing.

FIRST: Check if this document actually contains interview questions and answers.
- If the document is NOT about interview questions (e.g., invoice, resume, random text), return: {"interviewQuestions": []}
- If the document does not have clear Q&A format, return: {"interviewQuestions": []}

IF the document contains interview questions, parse them and extract up to 10 interview questions along with their answers, and FIX any spacing issues.

Return the data in JSON format with this exact structure:
{
  "interviewQuestions": [
    {
      "question": "question text here",
      "answer": "answer text here"
    }
  ]
}

Document text:
${textToProcess}

IMPORTANT: 
- Return ONLY the JSON response, no additional text
- If this is not an interview Q&A document, return empty array
- Extract up to 10 questions (or fewer if less are available)
- If the document has more than 10 questions, select the most important ones
- Do not include \`\`\`json markers or any other formatting
- Make sure each question has a corresponding answer
- FIX all spacing issues: add spaces between words that are joined together (like "Whatis" should be "What is", "Reactisa" should be "React is a")
- Ensure proper spacing around punctuation
- Make the text clean and readable with proper English spacing
- Only extract actual interview questions, not general text
- If the text appears to be cut off mid-answer, still extract the complete questions you can identify
`;

    console.log("Sending request to OpenAI...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that parses interview questions and answers from documents. You excel at understanding text with spacing issues and correcting them."
        },
        {
          role: "user",
          content: parsePrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error("No response from AI");
    }

    let parsedResponse = completion.choices[0].message.content.trim();

    console.log("AI response length:", parsedResponse.length);
    console.log("AI parsed response:", parsedResponse.substring(0, 500));

    if (!parsedResponse || parsedResponse.length === 0) {
      throw new Error("AI returned empty response");
    }

    // Validate JSON
    let jsonData;
    try {
      jsonData = JSON.parse(parsedResponse);
    } catch (parseError) {
      console.error("JSON parse error. Response was:", parsedResponse);
      throw new Error("AI response is not valid JSON: " + parseError.message);
    }
    
    if (!jsonData.interviewQuestions || !Array.isArray(jsonData.interviewQuestions)) {
      return NextResponse.json(
        { error: "Invalid document format. Could not parse questions and answers." },
        { status: 400 }
      );
    }

    if (jsonData.interviewQuestions.length === 0) {
      return NextResponse.json(
        { error: "No interview questions found in this document. Please upload a document that contains interview questions and their answers." },
        { status: 400 }
      );
    }

    const firstQuestion = jsonData.interviewQuestions[0];
    if (!firstQuestion.question || !firstQuestion.answer) {
      return NextResponse.json(
        { error: "Invalid document format. Could not extract valid questions and answers." },
        { status: 400 }
      );
    }

    const avgQuestionLength = jsonData.interviewQuestions.reduce((sum, q) => sum + (q.question?.length || 0), 0) / jsonData.interviewQuestions.length;
    if (avgQuestionLength < 10) {
      return NextResponse.json(
        { error: "This document does not appear to contain interview questions. Please upload a document with interview Q&A content." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse,
      extractedText: extractedText.substring(0, 500) + "..." // Send preview
    });

  } catch (error) {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }

    console.error("Error processing document:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Failed to process document: " + error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
