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
      resume,
      job,
    } = await request.json();

    if (
      !resume ||
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

    if (
      resume.trim().length < 100 ||
      job.trim().length < 100
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid resume and complete job description.",
        },
        {
          status: 400,
        }
      );
    }

    const prompt = `
You are an expert resume tailoring assistant.

Your job is to tailor the candidate resume for the target job.

CANDIDATE NAME:
${resumeName}

SOURCE RESUME:
${resume}

TARGET JOB DESCRIPTION:
${job}

IMPORTANT RULES:

1. Never invent experience.

2. Never invent skills.

3. Never invent education.

4. Never invent certifications.

5. Never invent achievements.

6. Never invent dates, companies or projects.

7. Only use information supported by the source resume.

8. Improve wording, clarity and ordering.

9. Use relevant phrases from the job description naturally when supported by the resume.

10. Keep the resume professional and concise.

11. Extract the job title.

12. Extract the company name when available.

13. Extract salary information when available.

14. Calculate a realistic match score from 0 to 100.

15. Missing requirements must reduce the match score.

16. Never add missing skills to the tailored resume.

17. Identify skills that genuinely match.

18. Identify important job skills missing from the resume.

19. Return only valid JSON.

20. Do not return markdown code fences.

Return exactly this structure:

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

    const {
      text,
      model,
    } = await generateGemini({
      prompt,
      json: true,
    });

    const result =
      JSON.parse(text);

    return NextResponse.json({
      ...result,
      generatedWith: model,
    });
  } catch (error) {
    console.error(
      "Tailor API error:",
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
          "Unable to tailor the resume. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}