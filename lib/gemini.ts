import "server-only";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is missing."
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const models = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

const sleep = (ms: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

function getStatus(
  error: unknown
): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error
  ) {
    const status = (
      error as {
        status?: unknown;
      }
    ).status;

    if (typeof status === "number") {
      return status;
    }
  }

  return undefined;
}

function canFallback(
  status?: number
) {
  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    status === 504
  );
}

type GenerateOptions = {
  prompt: string;
  json?: boolean;
};

export async function generateGemini({
  prompt,
  json = false,
}: GenerateOptions) {
  let lastError: unknown;

  for (
    let index = 0;
    index < models.length;
    index++
  ) {
    const model = models[index];

    try {
      console.log(
        `Trying Gemini model: ${model}`
      );

      const response =
        await ai.models.generateContent({
          model,
          contents: prompt,
          ...(json
            ? {
                config: {
                  responseMimeType:
                    "application/json",
                },
              }
            : {}),
        });

      if (!response.text) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      console.log(
        `Gemini success: ${model}`
      );

      return {
        text: response.text,
        model,
      };
    } catch (error) {
      lastError = error;

      const status =
        getStatus(error);

      console.error(
        `Gemini failed: ${model}`,
        status
      );

      if (!canFallback(status)) {
        throw error;
      }

      if (
        index <
        models.length - 1
      ) {
        await sleep(
          800 * (index + 1)
        );
      }
    }
  }

  throw lastError;
}

export function getGeminiErrorStatus(
  error: unknown
) {
  return getStatus(error);
}