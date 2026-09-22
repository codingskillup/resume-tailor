import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { resumeName, resume, job } = await request.json();

    if (!resume || !job) {
      return NextResponse.json(
        { error: "Resume and job description are required." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert resume tailoring assistant.

Your task is to tailor the candidate's existing resume for the target job.

IMPORTANT RULES:

1. Never invent experience, skills, education, certifications, achievements, dates, companies, or projects.
2. Only use information that already exists in the source resume.
3. Improve wording and ordering to make relevant experience clearer.
4. Use important phrases from the job description naturally when they are supported by the resume.
5. Keep the resume professional and concise.
6. Extract the job title, company and salary when available.
7. Calculate a match score from 0 to 100 based on how well the candidate's real experience matches the job.
8. Missing requirements must reduce the score. Do not add missing skills to the resume.
9. Return ONLY valid JSON. Do not use markdown or code fences.

Candidate name:
${resumeName}

SOURCE RESUME:
${resume}

TARGET JOB:
${job}

Return exactly this JSON structure:

{
  "role": "",
  "company": "",
  "salary": "",
  "matchScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "tailoredResume": ""
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    const result = JSON.parse(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tailor API error:", error);

    return NextResponse.json(
      { error: "Unable to tailor the resume. Please try again." },
      { status: 500 }
    );
  }
}