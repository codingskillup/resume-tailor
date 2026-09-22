import { NextResponse } from "next/server";
import {
  generateGemini,
  getGeminiErrorStatus,
} from "@/lib/gemini";

export async function POST(
  request: Request
) {
  try {
    const {
      resumeName,
      tailoredResume,
      job,
      role,
      company,
    } = await request.json();

    if (
      !tailoredResume ||
      !job
    ) {
      return NextResponse.json(
        {
          error:
            "Resume and job description are required.",
        },
        {
          status: 400,
        }
      );
    }

    const prompt = `
You are an expert technical interview coach.

Prepare this candidate for the target job interview.

CANDIDATE:
${resumeName}

TARGET ROLE:
${role || "Not specified"}

COMPANY:
${company || "Not specified"}

CANDIDATE RESUME:
${tailoredResume}

JOB DESCRIPTION:
${job}

Generate exactly 8 likely interview questions.

Include a useful mix of:

Technical questions
Experience based questions
Behavioral questions
Role specific questions

RULES:

1. Only use facts supported by the resume.

2. Never invent experience.

3. Never invent skills.

4. Never invent projects.

5. Never invent companies.

6. Never invent achievements.

7. Never invent education.

8. Never invent certifications.

9. Tailor questions to the target role.

10. Tailor questions to the job description.

11. Suggested answers should sound natural.

12. Answers should help the candidate prepare without sounding memorized.

13. If a required technology is missing from the resume, provide an honest way to answer.

14. Never pretend the candidate has experience they do not have.

15. Keep answers concise but useful.

16. Return exactly 8 questions.

17. Return only valid JSON.

18. Do not return markdown.

Return exactly:

{
  "questions": [
    {
      "question": "",
      "answer": "",
      "type": "Technical"
    }
  ]
}
`;

    const {
      text,
      model,
    } = await generateGemini({
      prompt,
      json: true,
    });

    const result =
      JSON.parse(text);

    if (
      !Array.isArray(
        result.questions
      )
    ) {
      throw new Error(
        "Invalid interview response."
      );
    }

    return NextResponse.json({
      questions:
        result.questions,
      generatedWith: model,
    });
  } catch (error) {
    console.error(
      "Interview API error:",
      error
    );

    const status =
      getGeminiErrorStatus(
        error
      );

    if (
      status === 503 ||
      status === 429
    ) {
      return NextResponse.json(
        {
          error:
            "AI is currently busy. Please try again in a moment.",
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to generate interview preparation. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}