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
Write a professional cover letter for this job application.

CANDIDATE:
${resumeName}

TARGET ROLE:
${role || "Not specified"}

COMPANY:
${company || "Not specified"}

TAILORED RESUME:
${tailoredResume}

JOB DESCRIPTION:
${job}

RULES:

1. Only use facts supported by the resume.

2. Never invent experience, skills, achievements, education or certifications.

3. Make the letter specific to the target role and company.

4. Highlight the most relevant real experience.

5. Keep the tone natural and professional.

6. Avoid generic filler.

7. Keep the letter concise.

8. Do not include fake addresses.

9. Do not include fake contact information.

10. Do not claim experience with skills missing from the resume.

11. Return only the cover letter.

12. Do not include markdown code fences.
`;

    const {
      text,
      model,
    } = await generateGemini({
      prompt,
    });

    return NextResponse.json({
      coverLetter:
        text.trim(),
      generatedWith: model,
    });
  } catch (error) {
    console.error(
      "Cover letter API error:",
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
          "Unable to generate the cover letter. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}